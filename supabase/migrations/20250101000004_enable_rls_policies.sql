-- Migration: Enable Row Level Security policies
-- Description: Comprehensive RLS policies with critical security fixes

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE career_canvas ENABLE ROW LEVEL SECURITY;
ALTER TABLE ninety_day_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE resume_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE mentor_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE mentor_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_usage_tracking ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- PROFILES POLICIES
-- ============================================================================
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Enable insert for authentication"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- ============================================================================
-- CAREER CANVAS POLICIES
-- ============================================================================
CREATE POLICY "Users can manage own canvas"
  ON career_canvas FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Mentors can view mentee canvas"
  ON career_canvas FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM mentor_access
      WHERE mentor_id = auth.uid() AND job_seeker_id = career_canvas.user_id
    )
  );

-- ============================================================================
-- 90-DAY PLANS POLICIES
-- ============================================================================
CREATE POLICY "Users can manage own plans"
  ON ninety_day_plans FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Mentors can view mentee plans"
  ON ninety_day_plans FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM mentor_access
      WHERE mentor_id = auth.uid() AND job_seeker_id = ninety_day_plans.user_id
    )
  );

-- ============================================================================
-- WEEKLY MILESTONES POLICIES
-- ============================================================================
CREATE POLICY "Users can manage own milestones"
  ON weekly_milestones FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM ninety_day_plans
      WHERE id = weekly_milestones.plan_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Mentors can view mentee milestones"
  ON weekly_milestones FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM ninety_day_plans p
      JOIN mentor_access ma ON ma.job_seeker_id = p.user_id
      WHERE p.id = weekly_milestones.plan_id AND ma.mentor_id = auth.uid()
    )
  );

-- ============================================================================
-- RESUME ANALYSES POLICIES
-- ============================================================================
CREATE POLICY "Users can manage own analyses"
  ON resume_analyses FOR ALL
  USING (auth.uid() = user_id);

-- ============================================================================
-- COMPANIES POLICIES
-- ============================================================================
CREATE POLICY "Users can manage own companies"
  ON companies FOR ALL
  USING (auth.uid() = user_id);

-- ============================================================================
-- MENTOR INVITATIONS POLICIES (with case-insensitive email matching)
-- ============================================================================
CREATE POLICY "Job seekers can manage own invitations"
  ON mentor_invitations FOR ALL
  USING (auth.uid() = job_seeker_id);

-- Mentors can view invitations sent to their email (case-insensitive)
CREATE POLICY "Mentors can view own invitations"
  ON mentor_invitations FOR SELECT
  USING (
    LOWER((SELECT email FROM profiles WHERE id = auth.uid())) = LOWER(mentor_email)
  );

-- Mentors can update invitations sent to their email (case-insensitive)
-- NOTE: Acceptance should be done via Edge function for transaction safety
CREATE POLICY "Mentors can update own invitations"
  ON mentor_invitations FOR UPDATE
  USING (
    LOWER((SELECT email FROM profiles WHERE id = auth.uid())) = LOWER(mentor_email)
  );

-- ============================================================================
-- MENTOR ACCESS POLICIES
-- ============================================================================
CREATE POLICY "Job seekers can manage own access"
  ON mentor_access FOR ALL
  USING (auth.uid() = job_seeker_id);

CREATE POLICY "Mentors can view own access"
  ON mentor_access FOR SELECT
  USING (auth.uid() = mentor_id);

-- ============================================================================
-- AI USAGE TRACKING POLICIES (service role only for writes)
-- ============================================================================
CREATE POLICY "Users can view own usage"
  ON ai_usage_tracking FOR SELECT
  USING (auth.uid() = user_id);

-- CRITICAL: Only service role (Edge Functions) can insert usage records
CREATE POLICY "Service role can insert usage"
  ON ai_usage_tracking FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

-- CRITICAL: Only service role (Edge Functions) can update usage records
CREATE POLICY "Service role can update usage"
  ON ai_usage_tracking FOR UPDATE
  USING (auth.role() = 'service_role');

-- ============================================================================
-- STORAGE RLS POLICIES (CRITICAL for resume uploads)
-- ============================================================================

-- Note: RLS is already enabled on storage.objects by Supabase
-- We just need to create the policies

-- Users can upload files to their own folder
CREATE POLICY "Users can upload own resumes"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'resumes' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Users can read their own files
CREATE POLICY "Users can read own resumes"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'resumes' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Service role can read all files (for Edge Functions to process resumes)
CREATE POLICY "Service role can read all resumes"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'resumes' AND
    auth.role() = 'service_role'
  );

-- Users can delete their own files
CREATE POLICY "Users can delete own resumes"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'resumes' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );
