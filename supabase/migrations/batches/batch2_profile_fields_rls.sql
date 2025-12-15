-- BATCH2_PROFILE_FIELDS_RLS
-- Run this in Supabase SQL Editor

-- ============================================
-- 20241213_add_profile_fields.sql
-- ============================================

-- Add new profile fields for onboarding and career tracking
-- Run this migration in Supabase SQL Editor

-- Contact Information
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone_number TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS current_location TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS linkedin_url TEXT;

-- Career Information
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS years_of_experience TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS "current_role" TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS specialization TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS education_level TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS areas_of_expertise TEXT[] DEFAULT '{}';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS skills TEXT[] DEFAULT '{}';

-- Career Goals
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS target_role TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS target_industry TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS job_search_status TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS work_preference TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS salary_expectation TEXT;

-- Onboarding Tracking
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS profile_completed BOOLEAN DEFAULT FALSE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS onboarding_completed_at TIMESTAMPTZ;

-- Add check constraints for enum-like fields
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_job_search_status_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_job_search_status_check
  CHECK (job_search_status IS NULL OR job_search_status IN ('actively_looking', 'passively_looking', 'employed_not_looking', 'open_to_opportunities'));

ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_work_preference_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_work_preference_check
  CHECK (work_preference IS NULL OR work_preference IN ('remote', 'hybrid', 'onsite', 'flexible'));

ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_education_level_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_education_level_check
  CHECK (education_level IS NULL OR education_level IN ('high_school', 'associate', 'bachelor', 'master', 'doctorate', 'other'));

-- Create index for faster profile completion checks
CREATE INDEX IF NOT EXISTS idx_profiles_profile_completed ON public.profiles(profile_completed);

-- Update RLS policies to allow users to update their own profile fields
-- (Existing policies should already cover this if you have update policies)

COMMENT ON COLUMN public.profiles.phone_number IS 'User phone number';
COMMENT ON COLUMN public.profiles.current_location IS 'City, State or Country';
COMMENT ON COLUMN public.profiles.linkedin_url IS 'LinkedIn profile URL';
COMMENT ON COLUMN public.profiles.years_of_experience IS 'Years of professional experience range';
COMMENT ON COLUMN public.profiles."current_role" IS 'Current job title';
COMMENT ON COLUMN public.profiles.specialization IS 'Area of specialization';
COMMENT ON COLUMN public.profiles.education_level IS 'Highest education level';
COMMENT ON COLUMN public.profiles.areas_of_expertise IS 'Array of expertise areas';
COMMENT ON COLUMN public.profiles.skills IS 'Array of skills';
COMMENT ON COLUMN public.profiles.target_role IS 'Desired job title';
COMMENT ON COLUMN public.profiles.target_industry IS 'Target industry';
COMMENT ON COLUMN public.profiles.job_search_status IS 'Current job search status';
COMMENT ON COLUMN public.profiles.work_preference IS 'Remote/Hybrid/Onsite preference';
COMMENT ON COLUMN public.profiles.salary_expectation IS 'Expected salary range';
COMMENT ON COLUMN public.profiles.profile_completed IS 'Whether user completed onboarding';
COMMENT ON COLUMN public.profiles.onboarding_completed_at IS 'Timestamp when onboarding was completed';


-- ============================================
-- 20250101000004_enable_rls_policies.sql
-- ============================================

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


