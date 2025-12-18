-- Migration: Create milestone_feedback and milestone_comments tables
-- Description: Tables for mentor feedback on milestones

-- Create milestone_feedback table
CREATE TABLE IF NOT EXISTS milestone_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  milestone_id UUID NOT NULL REFERENCES weekly_milestones(id) ON DELETE CASCADE,
  reviewer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reviewer_type TEXT NOT NULL CHECK (reviewer_type IN ('mentor', 'accountability_partner')),
  score TEXT CHECK (score IN ('happy', 'neutral', 'sad')),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(milestone_id, reviewer_id)
);

-- Create milestone_comments table
CREATE TABLE IF NOT EXISTS milestone_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  milestone_id UUID NOT NULL REFERENCES weekly_milestones(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  comment TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE milestone_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE milestone_comments ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- MILESTONE_FEEDBACK POLICIES
-- ============================================================================

-- Mentors can insert/update feedback on milestones for plans they have access to
CREATE POLICY "Mentors can manage feedback on accessible milestones"
  ON milestone_feedback FOR ALL
  USING (
    -- Reviewer is the current user
    reviewer_id = auth.uid()
    AND
    -- And they have mentor access to the plan owner
    EXISTS (
      SELECT 1 FROM weekly_milestones wm
      JOIN ninety_day_plans p ON p.id = wm.plan_id
      LEFT JOIN mentor_access ma ON ma.job_seeker_id = p.user_id AND ma.mentor_id = auth.uid()
      LEFT JOIN plan_collaborators pc ON pc.plan_id = p.id AND pc.collaborator_id = auth.uid() AND pc.status = 'accepted'
      WHERE wm.id = milestone_feedback.milestone_id
      AND (ma.id IS NOT NULL OR pc.id IS NOT NULL)
    )
  );

-- Plan owners can read feedback on their milestones
CREATE POLICY "Plan owners can read feedback"
  ON milestone_feedback FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM weekly_milestones wm
      JOIN ninety_day_plans p ON p.id = wm.plan_id
      WHERE wm.id = milestone_feedback.milestone_id
      AND p.user_id = auth.uid()
    )
  );

-- ============================================================================
-- MILESTONE_COMMENTS POLICIES
-- ============================================================================

-- Users can comment on milestones they have access to (owner or collaborator)
CREATE POLICY "Users can add comments to accessible milestones"
  ON milestone_comments FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM weekly_milestones wm
      JOIN ninety_day_plans p ON p.id = wm.plan_id
      LEFT JOIN mentor_access ma ON ma.job_seeker_id = p.user_id AND ma.mentor_id = auth.uid()
      LEFT JOIN plan_collaborators pc ON pc.plan_id = p.id AND pc.collaborator_id = auth.uid() AND pc.status = 'accepted'
      WHERE wm.id = milestone_comments.milestone_id
      AND (p.user_id = auth.uid() OR ma.id IS NOT NULL OR pc.id IS NOT NULL)
    )
  );

-- Users can read comments on milestones they have access to
CREATE POLICY "Users can read comments on accessible milestones"
  ON milestone_comments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM weekly_milestones wm
      JOIN ninety_day_plans p ON p.id = wm.plan_id
      LEFT JOIN mentor_access ma ON ma.job_seeker_id = p.user_id AND ma.mentor_id = auth.uid()
      LEFT JOIN plan_collaborators pc ON pc.plan_id = p.id AND pc.collaborator_id = auth.uid() AND pc.status = 'accepted'
      WHERE wm.id = milestone_comments.milestone_id
      AND (p.user_id = auth.uid() OR ma.id IS NOT NULL OR pc.id IS NOT NULL)
    )
  );

-- Users can delete their own comments
CREATE POLICY "Users can delete own comments"
  ON milestone_comments FOR DELETE
  USING (user_id = auth.uid());

-- ============================================================================
-- INDEXES
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_milestone_feedback_milestone_id ON milestone_feedback(milestone_id);
CREATE INDEX IF NOT EXISTS idx_milestone_feedback_reviewer_id ON milestone_feedback(reviewer_id);
CREATE INDEX IF NOT EXISTS idx_milestone_comments_milestone_id ON milestone_comments(milestone_id);
CREATE INDEX IF NOT EXISTS idx_milestone_comments_user_id ON milestone_comments(user_id);
