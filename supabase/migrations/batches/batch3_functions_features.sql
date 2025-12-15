-- BATCH3_FUNCTIONS_FEATURES
-- Run this in Supabase SQL Editor

-- ============================================
-- 20250109000001_add_increment_usage_function.sql
-- ============================================

-- Migration: Add increment_usage function
-- Description: Function to increment AI usage tracking

CREATE OR REPLACE FUNCTION increment_usage(
  p_user_id UUID,
  p_feature_type TEXT,
  p_month TEXT
)
RETURNS VOID AS $$
BEGIN
  -- Try to update existing record
  UPDATE ai_usage_tracking
  SET usage_count = usage_count + 1
  WHERE user_id = p_user_id
    AND feature_type = p_feature_type
    AND usage_month = p_month;

  -- If no row was updated, insert a new one
  IF NOT FOUND THEN
    INSERT INTO ai_usage_tracking (user_id, feature_type, usage_month, usage_count)
    VALUES (p_user_id, p_feature_type, p_month, 1);
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ============================================
-- 20250109000002_atomic_rate_limit.sql
-- ============================================

-- Migration: Atomic rate limit function
-- Description: Atomic increment with limit check to prevent race conditions

CREATE OR REPLACE FUNCTION increment_usage_with_limit(
  p_user_id UUID,
  p_feature_type TEXT,
  p_month TEXT,
  p_limit INTEGER
)
RETURNS TABLE(success BOOLEAN, usage_count INTEGER) AS $$
DECLARE
  v_new_count INTEGER;
  v_existing_count INTEGER;
BEGIN
  -- Try to update existing record atomically
  UPDATE ai_usage_tracking
  SET usage_count = usage_count + 1
  WHERE user_id = p_user_id
    AND feature_type = p_feature_type
    AND usage_month = p_month
    AND usage_count < p_limit
  RETURNING ai_usage_tracking.usage_count INTO v_new_count;

  -- If update succeeded, return the new count
  IF FOUND THEN
    RETURN QUERY SELECT true, v_new_count;
    RETURN;
  END IF;

  -- Check if record exists but is at limit
  SELECT ai_usage_tracking.usage_count INTO v_existing_count
  FROM ai_usage_tracking
  WHERE user_id = p_user_id
    AND feature_type = p_feature_type
    AND usage_month = p_month;

  -- If record exists and at/over limit, return failure
  IF FOUND THEN
    RETURN QUERY SELECT false, v_existing_count;
    RETURN;
  END IF;

  -- No record exists, create one with count = 1
  BEGIN
    INSERT INTO ai_usage_tracking (user_id, feature_type, usage_month, usage_count)
    VALUES (p_user_id, p_feature_type, p_month, 1)
    RETURNING ai_usage_tracking.usage_count INTO v_new_count;

    RETURN QUERY SELECT true, v_new_count;
    RETURN;
  EXCEPTION
    WHEN unique_violation THEN
      -- Race condition: another request created the record
      -- Retry the update
      UPDATE ai_usage_tracking
      SET usage_count = usage_count + 1
      WHERE user_id = p_user_id
        AND feature_type = p_feature_type
        AND usage_month = p_month
        AND usage_count < p_limit
      RETURNING ai_usage_tracking.usage_count INTO v_new_count;

      IF FOUND THEN
        RETURN QUERY SELECT true, v_new_count;
      ELSE
        -- At limit after race condition
        SELECT ai_usage_tracking.usage_count INTO v_existing_count
        FROM ai_usage_tracking
        WHERE user_id = p_user_id
          AND feature_type = p_feature_type
          AND usage_month = p_month;

        RETURN QUERY SELECT false, v_existing_count;
      END IF;
  END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comment
COMMENT ON FUNCTION increment_usage_with_limit IS 'Atomically increments usage count if under limit, prevents race conditions';


-- ============================================
-- 20250111000001_add_reorder_milestones_function.sql
-- ============================================

-- Migration: Add atomic reorder_milestones function
-- This function updates milestone order_index values atomically in a single transaction
-- Prevents race conditions when multiple updates would otherwise use Promise.all

CREATE OR REPLACE FUNCTION reorder_milestones(
  milestone_updates jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  update_record jsonb;
  milestone_id uuid;
  new_order int;
BEGIN
  -- Validate input
  IF milestone_updates IS NULL OR jsonb_array_length(milestone_updates) = 0 THEN
    RAISE EXCEPTION 'milestone_updates cannot be empty';
  END IF;

  -- Iterate through each update and apply atomically
  FOR update_record IN SELECT * FROM jsonb_array_elements(milestone_updates)
  LOOP
    milestone_id := (update_record->>'id')::uuid;
    new_order := (update_record->>'order_index')::int;

    -- Verify the milestone belongs to a plan owned by the current user
    IF NOT EXISTS (
      SELECT 1 FROM weekly_milestones wm
      JOIN ninety_day_plans p ON wm.plan_id = p.id
      WHERE wm.id = milestone_id AND p.user_id = auth.uid()
    ) THEN
      RAISE EXCEPTION 'Milestone % not found or access denied', milestone_id;
    END IF;

    -- Update the order_index
    UPDATE weekly_milestones
    SET order_index = new_order, updated_at = now()
    WHERE id = milestone_id;
  END LOOP;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION reorder_milestones(jsonb) TO authenticated;

COMMENT ON FUNCTION reorder_milestones IS 'Atomically reorder milestones within a plan. Takes array of {id, order_index} objects.';


-- ============================================
-- 20250111000002_enhance_resume_analyses.sql
-- ============================================

-- Migration: Enhance resume_analyses table with additional analysis fields
-- Date: 2025-01-11
-- Description: Add new columns for enhanced resume analysis (candidate name, target country, summary, experience level, skills, role recommendations, job search approach, 90-day strategy)

-- Add new columns to resume_analyses table
ALTER TABLE resume_analyses
ADD COLUMN IF NOT EXISTS candidate_name TEXT,
ADD COLUMN IF NOT EXISTS target_country TEXT DEFAULT 'United Arab Emirates',
ADD COLUMN IF NOT EXISTS summary TEXT,
ADD COLUMN IF NOT EXISTS experience_level TEXT,
ADD COLUMN IF NOT EXISTS skills_identified JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS role_recommendations JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS job_search_approach JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS ninety_day_strategy JSONB DEFAULT '{}'::jsonb;

-- Add comment for documentation
COMMENT ON COLUMN resume_analyses.candidate_name IS 'Full name of the candidate extracted from resume';
COMMENT ON COLUMN resume_analyses.target_country IS 'Target country for job search analysis';
COMMENT ON COLUMN resume_analyses.summary IS 'Brief executive summary of the candidate profile';
COMMENT ON COLUMN resume_analyses.experience_level IS 'Entry-level, Mid-level, Senior, or Executive';
COMMENT ON COLUMN resume_analyses.skills_identified IS 'Array of all technical and soft skills found';
COMMENT ON COLUMN resume_analyses.role_recommendations IS 'Array of suitable job roles for the candidate';
COMMENT ON COLUMN resume_analyses.job_search_approach IS 'Array of strategic job search recommendations';
COMMENT ON COLUMN resume_analyses.ninety_day_strategy IS 'JSON object with overview and weekly action items';


-- ============================================
-- 20250112000001_add_interviews_table.sql
-- ============================================

-- Interviews table
CREATE TABLE interviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
  company_name TEXT NOT NULL,
  position TEXT NOT NULL,
  interview_type TEXT NOT NULL CHECK (interview_type IN ('phone_screen', 'technical', 'behavioral', 'final', 'offer', 'other')),
  scheduled_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled', 'rescheduled')),
  prep_notes TEXT,
  questions_asked TEXT[],
  interviewer_names TEXT[],
  feedback TEXT,
  follow_up_date DATE,
  follow_up_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS policies
ALTER TABLE interviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own interviews" ON interviews
  FOR ALL USING (auth.uid() = user_id);

-- Index for faster queries
CREATE INDEX idx_interviews_user_id ON interviews(user_id);
CREATE INDEX idx_interviews_scheduled_at ON interviews(scheduled_at);
CREATE INDEX idx_interviews_company_id ON interviews(company_id);


-- ============================================
-- 20250112000002_add_job_listings_table.sql
-- ============================================

-- Job listings table
CREATE TABLE job_listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  company_name TEXT NOT NULL,
  location TEXT,
  job_url TEXT,
  source TEXT CHECK (source IN ('linkedin', 'indeed', 'glassdoor', 'company_site', 'referral', 'other')),
  description TEXT,
  salary_range TEXT,
  job_type TEXT CHECK (job_type IN ('full_time', 'part_time', 'contract', 'internship', 'remote')),
  application_status TEXT NOT NULL DEFAULT 'saved' CHECK (application_status IN ('saved', 'applied', 'interviewing', 'offer', 'rejected', 'withdrawn')),
  applied_date DATE,
  deadline DATE,
  notes TEXT,
  is_favorite BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS policies
ALTER TABLE job_listings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own job listings" ON job_listings
  FOR ALL USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX idx_job_listings_user_id ON job_listings(user_id);
CREATE INDEX idx_job_listings_status ON job_listings(application_status);
CREATE INDEX idx_job_listings_company_id ON job_listings(company_id);

-- Trigger to update updated_at timestamp
CREATE TRIGGER update_job_listings_updated_at
  BEFORE UPDATE ON job_listings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();


-- ============================================
-- 20250112000003_add_notifications_table.sql
-- ============================================

-- Notifications table
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('interview_reminder', 'follow_up', 'milestone_due', 'plan_reminder', 'system')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  link TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notification preferences
CREATE TABLE notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  email_interview_reminder BOOLEAN DEFAULT TRUE,
  email_follow_up_reminder BOOLEAN DEFAULT TRUE,
  email_milestone_reminder BOOLEAN DEFAULT TRUE,
  email_weekly_summary BOOLEAN DEFAULT TRUE,
  in_app_enabled BOOLEAN DEFAULT TRUE,
  reminder_days_before INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS policies
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own notifications" ON notifications
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own preferences" ON notification_preferences
  FOR ALL USING (auth.uid() = user_id);

-- Index
CREATE INDEX idx_notifications_user_unread ON notifications(user_id, is_read);


