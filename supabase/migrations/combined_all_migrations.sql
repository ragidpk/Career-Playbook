-- Combined migrations for Career Playbook
-- Run this in Supabase SQL Editor

-- ========================================
-- 20241213_add_profile_fields.sql
-- ========================================

-- Add new profile fields for onboarding and career tracking
-- Run this migration in Supabase SQL Editor

-- Contact Information
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone_number TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS current_location TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS linkedin_url TEXT;

-- Career Information
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS years_of_experience TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS current_role TEXT;
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
COMMENT ON COLUMN public.profiles.current_role IS 'Current job title';
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


-- ========================================
-- 20250101000001_create_helper_functions.sql
-- ========================================

-- Migration: Create helper functions
-- Description: Reusable database functions for triggers

-- Function: update_updated_at_column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function: calculate_canvas_completion
CREATE OR REPLACE FUNCTION calculate_canvas_completion()
RETURNS TRIGGER AS $$
BEGIN
  NEW.completion_percentage := (
    (CASE WHEN LENGTH(TRIM(COALESCE(NEW.section_1_helpers, ''))) > 0 THEN 1 ELSE 0 END) +
    (CASE WHEN LENGTH(TRIM(COALESCE(NEW.section_2_activities, ''))) > 0 THEN 1 ELSE 0 END) +
    (CASE WHEN LENGTH(TRIM(COALESCE(NEW.section_3_value, ''))) > 0 THEN 1 ELSE 0 END) +
    (CASE WHEN LENGTH(TRIM(COALESCE(NEW.section_4_interactions, ''))) > 0 THEN 1 ELSE 0 END) +
    (CASE WHEN LENGTH(TRIM(COALESCE(NEW.section_5_convince, ''))) > 0 THEN 1 ELSE 0 END) +
    (CASE WHEN LENGTH(TRIM(COALESCE(NEW.section_6_skills, ''))) > 0 THEN 1 ELSE 0 END) +
    (CASE WHEN LENGTH(TRIM(COALESCE(NEW.section_7_motivation, ''))) > 0 THEN 1 ELSE 0 END) +
    (CASE WHEN LENGTH(TRIM(COALESCE(NEW.section_8_sacrifices, ''))) > 0 THEN 1 ELSE 0 END) +
    (CASE WHEN LENGTH(TRIM(COALESCE(NEW.section_9_outcomes, ''))) > 0 THEN 1 ELSE 0 END)
  ) * 100 / 9;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function: handle_new_user (auto-create profile on signup)
-- This prevents race conditions between signup and profile creation
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    'job_seeker'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-create profile on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();


-- ========================================
-- 20250101000002_create_core_tables.sql
-- ========================================

-- Migration: Create core tables
-- Description: User profiles, career canvas, plans, milestones, resume analyses, companies, AI usage tracking

-- 1. profiles table
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  role TEXT DEFAULT 'job_seeker' CHECK (role IN ('job_seeker', 'mentor')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_profiles_email ON profiles(email);
CREATE INDEX idx_profiles_role ON profiles(role);

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 2. career_canvas table
CREATE TABLE career_canvas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  section_1_helpers TEXT,
  section_2_activities TEXT,
  section_3_value TEXT,
  section_4_interactions TEXT,
  section_5_convince TEXT,
  section_6_skills TEXT,
  section_7_motivation TEXT,
  section_8_sacrifices TEXT,
  section_9_outcomes TEXT,
  completion_percentage INTEGER DEFAULT 0 CHECK (completion_percentage >= 0 AND completion_percentage <= 100),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT one_canvas_per_user UNIQUE (user_id)
);

CREATE INDEX idx_canvas_user_id ON career_canvas(user_id);

CREATE TRIGGER update_canvas_updated_at
  BEFORE UPDATE ON career_canvas
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER canvas_completion_trigger
  BEFORE INSERT OR UPDATE ON career_canvas
  FOR EACH ROW EXECUTE FUNCTION calculate_canvas_completion();

-- 3. ninety_day_plans table
CREATE TABLE ninety_day_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'paused')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT valid_date_range CHECK (end_date > start_date)
);

CREATE INDEX idx_plans_user_id ON ninety_day_plans(user_id);
CREATE INDEX idx_plans_status ON ninety_day_plans(status);

CREATE TRIGGER update_plans_updated_at
  BEFORE UPDATE ON ninety_day_plans
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 4. weekly_milestones table
CREATE TABLE weekly_milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID NOT NULL REFERENCES ninety_day_plans(id) ON DELETE CASCADE,
  week_number INTEGER NOT NULL CHECK (week_number >= 1 AND week_number <= 12),
  goal TEXT NOT NULL CHECK (LENGTH(goal) <= 200),
  notes TEXT,
  status TEXT DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed')),
  order_index INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_plan_week UNIQUE (plan_id, week_number)
);

CREATE INDEX idx_milestones_plan_id ON weekly_milestones(plan_id);
CREATE INDEX idx_milestones_status ON weekly_milestones(status);
CREATE INDEX idx_milestones_order ON weekly_milestones(order_index);

CREATE TRIGGER update_milestones_updated_at
  BEFORE UPDATE ON weekly_milestones
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 5. resume_analyses table
CREATE TABLE resume_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size INTEGER,
  extracted_text TEXT,
  ats_score INTEGER CHECK (ats_score >= 0 AND ats_score <= 100),
  strengths JSONB,
  gaps JSONB,
  recommendations JSONB,
  analysis_date TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_analyses_user_id ON resume_analyses(user_id);
CREATE INDEX idx_analyses_date ON resume_analyses(analysis_date DESC);

-- 6. companies table
CREATE TABLE companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  website_url TEXT,
  status TEXT DEFAULT 'researching' CHECK (status IN ('researching', 'applied', 'interviewing', 'offer', 'rejected')),
  notes TEXT,
  date_added DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_companies_user_id ON companies(user_id);
CREATE INDEX idx_companies_status ON companies(status);
CREATE INDEX idx_companies_name ON companies(name);
CREATE INDEX idx_companies_date ON companies(date_added DESC);

CREATE TRIGGER update_companies_updated_at
  BEFORE UPDATE ON companies
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 7. ai_usage_tracking table
CREATE TABLE ai_usage_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  feature_type TEXT NOT NULL CHECK (feature_type IN ('resume_analysis', 'linkedin_analysis', 'milestone_generation')),
  usage_month TEXT NOT NULL,
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_user_feature_month UNIQUE (user_id, feature_type, usage_month)
);

CREATE INDEX idx_usage_user_feature ON ai_usage_tracking(user_id, feature_type);
CREATE INDEX idx_usage_month ON ai_usage_tracking(usage_month);

CREATE TRIGGER update_usage_updated_at
  BEFORE UPDATE ON ai_usage_tracking
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- ========================================
-- 20250101000003_create_relationship_tables.sql
-- ========================================

-- Migration: Create relationship tables
-- Description: Mentor invitations and access control

-- mentor_invitations table
CREATE TABLE mentor_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_seeker_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  mentor_email TEXT NOT NULL,
  mentor_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  invited_at TIMESTAMPTZ DEFAULT NOW(),
  accepted_at TIMESTAMPTZ,
  CONSTRAINT unique_invitation UNIQUE (job_seeker_id, mentor_email)
);

CREATE INDEX idx_invitations_job_seeker ON mentor_invitations(job_seeker_id);
CREATE INDEX idx_invitations_mentor_email ON mentor_invitations(mentor_email);
CREATE INDEX idx_invitations_mentor_id ON mentor_invitations(mentor_id);
CREATE INDEX idx_invitations_status ON mentor_invitations(status);

-- mentor_access table
CREATE TABLE mentor_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_seeker_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  mentor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  permission_level TEXT DEFAULT 'view' CHECK (permission_level IN ('view', 'comment', 'edit')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_mentor_access UNIQUE (job_seeker_id, mentor_id)
);

CREATE INDEX idx_access_job_seeker ON mentor_access(job_seeker_id);
CREATE INDEX idx_access_mentor ON mentor_access(mentor_id);


-- ========================================
-- 20250101000004_enable_rls_policies.sql
-- ========================================

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


-- ========================================
-- 20250109000001_add_increment_usage_function.sql
-- ========================================

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


-- ========================================
-- 20250109000002_atomic_rate_limit.sql
-- ========================================

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


-- ========================================
-- 20250111000001_add_reorder_milestones_function.sql
-- ========================================

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


-- ========================================
-- 20250111000002_enhance_resume_analyses.sql
-- ========================================

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


-- ========================================
-- 20250112000001_add_interviews_table.sql
-- ========================================

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


-- ========================================
-- 20250112000002_add_job_listings_table.sql
-- ========================================

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


-- ========================================
-- 20250112000003_add_notifications_table.sql
-- ========================================

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


-- ========================================
-- 20250112000004_enhance_companies_crm.sql
-- ========================================

-- Enhance companies table for Job Hunt CRM
-- Add comprehensive fields for job search tracking

-- Contact Information
ALTER TABLE companies ADD COLUMN IF NOT EXISTS contact_name text;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS contact_email text;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS contact_phone text;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS contact_linkedin text;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS contact_title text;

-- Job Details
ALTER TABLE companies ADD COLUMN IF NOT EXISTS job_title text;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS job_posting_url text;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS salary_range text;

-- Company Details
ALTER TABLE companies ADD COLUMN IF NOT EXISTS industry text;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS company_size text;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS location text;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS company_linkedin text;

-- Tracking Fields
ALTER TABLE companies ADD COLUMN IF NOT EXISTS application_date date;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS last_contact_date date;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS next_followup_date date;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS referral_source text;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS priority integer DEFAULT 3 CHECK (priority >= 1 AND priority <= 5);
ALTER TABLE companies ADD COLUMN IF NOT EXISTS is_favorite boolean DEFAULT false;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_companies_next_followup ON companies(next_followup_date) WHERE next_followup_date IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_companies_priority ON companies(priority);
CREATE INDEX IF NOT EXISTS idx_companies_is_favorite ON companies(is_favorite) WHERE is_favorite = true;


-- ========================================
-- 20250112000005_job_hunt_crm_enums.sql
-- ========================================

-- ============================================
-- JOB HUNT CRM - ENUM TYPES
-- Based on PRD: job-hunt-crm-prd.md
-- ============================================

-- Company size enum
DO $$ BEGIN
    CREATE TYPE company_size_enum AS ENUM ('startup', 'smb', 'mid_market', 'enterprise');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Priority tier enum (A/B/C classification)
DO $$ BEGIN
    CREATE TYPE priority_tier_enum AS ENUM ('A', 'B', 'C');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Relationship type enum
DO $$ BEGIN
    CREATE TYPE relationship_type_enum AS ENUM ('recruiter', 'hiring_manager', 'referral', 'peer', 'mentor', 'other');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Relationship strength enum
DO $$ BEGIN
    CREATE TYPE relationship_strength_enum AS ENUM ('cold', 'warm', 'strong');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Location type enum
DO $$ BEGIN
    CREATE TYPE location_type_enum AS ENUM ('remote', 'hybrid', 'onsite');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Application status enum (full pipeline)
DO $$ BEGIN
    CREATE TYPE application_status_enum AS ENUM (
        'wishlist', 'applied', 'screening', 'phone_interview',
        'technical_interview', 'onsite_interview', 'final_round',
        'offer_received', 'negotiating', 'accepted', 'rejected', 'withdrawn'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Priority level enum
DO $$ BEGIN
    CREATE TYPE priority_level_enum AS ENUM ('high', 'medium', 'low');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Interaction type enum
DO $$ BEGIN
    CREATE TYPE interaction_type_enum AS ENUM (
        'email', 'call', 'meeting', 'linkedin_message',
        'interview', 'networking_event', 'other'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Direction type enum
DO $$ BEGIN
    CREATE TYPE direction_type_enum AS ENUM ('inbound', 'outbound');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Sentiment type enum
DO $$ BEGIN
    CREATE TYPE sentiment_type_enum AS ENUM ('positive', 'neutral', 'negative');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Interview type enum
DO $$ BEGIN
    CREATE TYPE interview_type_enum AS ENUM (
        'phone', 'video', 'technical', 'behavioral',
        'panel', 'onsite', 'presentation', 'case_study'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Interview outcome enum
DO $$ BEGIN
    CREATE TYPE interview_outcome_enum AS ENUM ('passed', 'failed', 'pending', 'rescheduled', 'cancelled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Task type enum
DO $$ BEGIN
    CREATE TYPE task_type_enum AS ENUM (
        'follow_up', 'apply', 'research', 'prep',
        'thank_you', 'networking', 'document', 'other'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Task status enum
DO $$ BEGIN
    CREATE TYPE task_status_enum AS ENUM ('pending', 'in_progress', 'completed', 'skipped');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Document type enum
DO $$ BEGIN
    CREATE TYPE document_type_enum AS ENUM (
        'resume', 'cover_letter', 'portfolio',
        'reference_letter', 'transcript', 'certification', 'other'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Entity type enum (for tagging)
DO $$ BEGIN
    CREATE TYPE entity_type_enum AS ENUM ('company', 'contact', 'application');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;


-- ========================================
-- 20250112000006_job_hunt_crm_tables.sql
-- ========================================

-- ============================================
-- JOB HUNT CRM - CORE TABLES
-- Based on PRD: job-hunt-crm-prd.md
-- ============================================

-- ============================================
-- CRM_COMPANIES TABLE (extends existing companies)
-- ============================================
CREATE TABLE IF NOT EXISTS crm_companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    industry VARCHAR(100),
    company_size company_size_enum,
    location VARCHAR(255),
    website VARCHAR(500),
    linkedin_url VARCHAR(500),
    glassdoor_rating DECIMAL(2,1) CHECK (glassdoor_rating >= 1.0 AND glassdoor_rating <= 5.0),
    culture_notes TEXT,
    priority_tier priority_tier_enum DEFAULT 'B',
    is_archived BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for crm_companies
CREATE INDEX IF NOT EXISTS idx_crm_companies_user_id ON crm_companies(user_id);
CREATE INDEX IF NOT EXISTS idx_crm_companies_name ON crm_companies(name);
CREATE INDEX IF NOT EXISTS idx_crm_companies_priority ON crm_companies(user_id, priority_tier) WHERE NOT is_archived;
CREATE INDEX IF NOT EXISTS idx_crm_companies_industry ON crm_companies(industry);

-- ============================================
-- CRM_CONTACTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS crm_contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    company_id UUID REFERENCES crm_companies(id) ON DELETE SET NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100),
    title VARCHAR(150),
    email VARCHAR(255),
    phone VARCHAR(50),
    linkedin_url VARCHAR(500),
    relationship_type relationship_type_enum,
    relationship_strength relationship_strength_enum DEFAULT 'cold',
    source VARCHAR(255),
    notes TEXT,
    last_contact_date DATE,
    is_archived BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for crm_contacts
CREATE INDEX IF NOT EXISTS idx_crm_contacts_user_id ON crm_contacts(user_id);
CREATE INDEX IF NOT EXISTS idx_crm_contacts_company_id ON crm_contacts(company_id);
CREATE INDEX IF NOT EXISTS idx_crm_contacts_name ON crm_contacts(first_name, last_name);
CREATE INDEX IF NOT EXISTS idx_crm_contacts_relationship ON crm_contacts(user_id, relationship_strength) WHERE NOT is_archived;
CREATE INDEX IF NOT EXISTS idx_crm_contacts_last_contact ON crm_contacts(user_id, last_contact_date) WHERE NOT is_archived;

-- ============================================
-- CRM_DOCUMENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS crm_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    document_type document_type_enum NOT NULL,
    name VARCHAR(255) NOT NULL,
    file_path VARCHAR(1000) NOT NULL,
    file_size INTEGER,
    mime_type VARCHAR(100),
    target_role VARCHAR(255),
    target_industry VARCHAR(100),
    is_default BOOLEAN DEFAULT FALSE,
    version_number INTEGER DEFAULT 1,
    parent_document_id UUID REFERENCES crm_documents(id) ON DELETE SET NULL,
    ai_analysis JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for crm_documents
CREATE INDEX IF NOT EXISTS idx_crm_documents_user_id ON crm_documents(user_id);
CREATE INDEX IF NOT EXISTS idx_crm_documents_type ON crm_documents(user_id, document_type);
CREATE INDEX IF NOT EXISTS idx_crm_documents_default ON crm_documents(user_id, document_type, is_default) WHERE is_default = TRUE;

-- ============================================
-- CRM_APPLICATIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS crm_applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES crm_companies(id) ON DELETE CASCADE,
    job_title VARCHAR(255) NOT NULL,
    job_url VARCHAR(1000),
    job_description TEXT,
    salary_min INTEGER,
    salary_max INTEGER,
    salary_currency VARCHAR(3) DEFAULT 'USD',
    location_type location_type_enum,
    work_location VARCHAR(255),
    application_date DATE,
    source VARCHAR(100),
    status application_status_enum DEFAULT 'wishlist',
    priority priority_level_enum DEFAULT 'medium',
    resume_id UUID REFERENCES crm_documents(id) ON DELETE SET NULL,
    cover_letter_id UUID REFERENCES crm_documents(id) ON DELETE SET NULL,
    referral_contact_id UUID REFERENCES crm_contacts(id) ON DELETE SET NULL,
    fit_score INTEGER CHECK (fit_score >= 0 AND fit_score <= 100),
    notes TEXT,
    rejection_reason VARCHAR(500),
    offer_amount INTEGER,
    offer_details TEXT,
    decision_deadline DATE,
    is_archived BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for crm_applications
CREATE INDEX IF NOT EXISTS idx_crm_applications_user_id ON crm_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_crm_applications_company_id ON crm_applications(company_id);
CREATE INDEX IF NOT EXISTS idx_crm_applications_status ON crm_applications(user_id, status) WHERE NOT is_archived;
CREATE INDEX IF NOT EXISTS idx_crm_applications_date ON crm_applications(user_id, application_date DESC) WHERE NOT is_archived;
CREATE INDEX IF NOT EXISTS idx_crm_applications_priority ON crm_applications(user_id, priority, status) WHERE NOT is_archived;

-- ============================================
-- CRM_APPLICATION_STATUS_HISTORY TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS crm_application_status_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID NOT NULL REFERENCES crm_applications(id) ON DELETE CASCADE,
    previous_status application_status_enum,
    new_status application_status_enum NOT NULL,
    changed_at TIMESTAMPTZ DEFAULT NOW(),
    notes TEXT
);

-- Indexes for status history
CREATE INDEX IF NOT EXISTS idx_crm_status_history_application ON crm_application_status_history(application_id);
CREATE INDEX IF NOT EXISTS idx_crm_status_history_changed_at ON crm_application_status_history(application_id, changed_at DESC);

-- ============================================
-- CRM_INTERACTIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS crm_interactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    application_id UUID REFERENCES crm_applications(id) ON DELETE CASCADE,
    contact_id UUID REFERENCES crm_contacts(id) ON DELETE CASCADE,
    interaction_type interaction_type_enum NOT NULL,
    direction direction_type_enum,
    subject VARCHAR(255),
    notes TEXT,
    interaction_date TIMESTAMPTZ NOT NULL,
    follow_up_needed BOOLEAN DEFAULT FALSE,
    follow_up_date DATE,
    sentiment sentiment_type_enum,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- At least one of application_id or contact_id should be set
    CONSTRAINT crm_interaction_reference CHECK (
        application_id IS NOT NULL OR contact_id IS NOT NULL
    )
);

-- Indexes for crm_interactions
CREATE INDEX IF NOT EXISTS idx_crm_interactions_user_id ON crm_interactions(user_id);
CREATE INDEX IF NOT EXISTS idx_crm_interactions_application ON crm_interactions(application_id);
CREATE INDEX IF NOT EXISTS idx_crm_interactions_contact ON crm_interactions(contact_id);
CREATE INDEX IF NOT EXISTS idx_crm_interactions_date ON crm_interactions(user_id, interaction_date DESC);
CREATE INDEX IF NOT EXISTS idx_crm_interactions_follow_up ON crm_interactions(user_id, follow_up_date)
    WHERE follow_up_needed = TRUE;

-- ============================================
-- CRM_INTERVIEWS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS crm_interviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    application_id UUID NOT NULL REFERENCES crm_applications(id) ON DELETE CASCADE,
    round_number INTEGER NOT NULL,
    interview_type interview_type_enum NOT NULL,
    scheduled_at TIMESTAMPTZ,
    duration_minutes INTEGER,
    timezone VARCHAR(50),
    location VARCHAR(500),
    interviewer_names TEXT[],
    interviewer_titles TEXT[],
    prep_notes TEXT,
    questions_asked TEXT,
    post_notes TEXT,
    outcome interview_outcome_enum,
    feedback_received TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for crm_interviews
CREATE INDEX IF NOT EXISTS idx_crm_interviews_user_id ON crm_interviews(user_id);
CREATE INDEX IF NOT EXISTS idx_crm_interviews_application ON crm_interviews(application_id);
CREATE INDEX IF NOT EXISTS idx_crm_interviews_scheduled ON crm_interviews(user_id, scheduled_at)
    WHERE scheduled_at IS NOT NULL;

-- ============================================
-- CRM_TASKS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS crm_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    application_id UUID REFERENCES crm_applications(id) ON DELETE CASCADE,
    contact_id UUID REFERENCES crm_contacts(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    task_type task_type_enum,
    due_date DATE,
    reminder_at TIMESTAMPTZ,
    priority priority_level_enum DEFAULT 'medium',
    status task_status_enum DEFAULT 'pending',
    completed_at TIMESTAMPTZ,
    is_recurring BOOLEAN DEFAULT FALSE,
    recurrence_rule VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for crm_tasks
CREATE INDEX IF NOT EXISTS idx_crm_tasks_user_id ON crm_tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_crm_tasks_application ON crm_tasks(application_id);
CREATE INDEX IF NOT EXISTS idx_crm_tasks_contact ON crm_tasks(contact_id);
CREATE INDEX IF NOT EXISTS idx_crm_tasks_due ON crm_tasks(user_id, due_date) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_crm_tasks_status ON crm_tasks(user_id, status);
CREATE INDEX IF NOT EXISTS idx_crm_tasks_reminder ON crm_tasks(reminder_at) WHERE reminder_at IS NOT NULL AND status = 'pending';

-- ============================================
-- CRM_TAGS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS crm_tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(50) NOT NULL,
    color VARCHAR(7),
    created_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(user_id, name)
);

-- Index for crm_tags
CREATE INDEX IF NOT EXISTS idx_crm_tags_user_id ON crm_tags(user_id);

-- ============================================
-- CRM_ENTITY_TAGS (Junction Table)
-- ============================================
CREATE TABLE IF NOT EXISTS crm_entity_tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tag_id UUID NOT NULL REFERENCES crm_tags(id) ON DELETE CASCADE,
    entity_type entity_type_enum NOT NULL,
    entity_id UUID NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(tag_id, entity_type, entity_id)
);

-- Indexes for crm_entity_tags
CREATE INDEX IF NOT EXISTS idx_crm_entity_tags_tag ON crm_entity_tags(tag_id);
CREATE INDEX IF NOT EXISTS idx_crm_entity_tags_entity ON crm_entity_tags(entity_type, entity_id);


-- ========================================
-- 20250112000007_job_hunt_crm_rls.sql
-- ========================================

-- ============================================
-- JOB HUNT CRM - ROW LEVEL SECURITY POLICIES
-- Based on PRD: job-hunt-crm-prd.md
-- ============================================

-- Enable RLS on all CRM tables
ALTER TABLE crm_companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_application_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_interviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_entity_tags ENABLE ROW LEVEL SECURITY;

-- ============================================
-- CRM_COMPANIES POLICIES
-- ============================================
CREATE POLICY "Users can view own crm_companies" ON crm_companies
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own crm_companies" ON crm_companies
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own crm_companies" ON crm_companies
    FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own crm_companies" ON crm_companies
    FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- CRM_CONTACTS POLICIES
-- ============================================
CREATE POLICY "Users can view own crm_contacts" ON crm_contacts
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own crm_contacts" ON crm_contacts
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own crm_contacts" ON crm_contacts
    FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own crm_contacts" ON crm_contacts
    FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- CRM_DOCUMENTS POLICIES
-- ============================================
CREATE POLICY "Users can view own crm_documents" ON crm_documents
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own crm_documents" ON crm_documents
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own crm_documents" ON crm_documents
    FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own crm_documents" ON crm_documents
    FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- CRM_APPLICATIONS POLICIES
-- ============================================
CREATE POLICY "Users can view own crm_applications" ON crm_applications
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own crm_applications" ON crm_applications
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own crm_applications" ON crm_applications
    FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own crm_applications" ON crm_applications
    FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- CRM_APPLICATION_STATUS_HISTORY POLICIES
-- ============================================
CREATE POLICY "Users can view own crm_application_history" ON crm_application_status_history
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM crm_applications
            WHERE crm_applications.id = crm_application_status_history.application_id
            AND crm_applications.user_id = auth.uid()
        )
    );
CREATE POLICY "Users can insert own crm_application_history" ON crm_application_status_history
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM crm_applications
            WHERE crm_applications.id = crm_application_status_history.application_id
            AND crm_applications.user_id = auth.uid()
        )
    );

-- ============================================
-- CRM_INTERACTIONS POLICIES
-- ============================================
CREATE POLICY "Users can view own crm_interactions" ON crm_interactions
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own crm_interactions" ON crm_interactions
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own crm_interactions" ON crm_interactions
    FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own crm_interactions" ON crm_interactions
    FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- CRM_INTERVIEWS POLICIES
-- ============================================
CREATE POLICY "Users can view own crm_interviews" ON crm_interviews
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own crm_interviews" ON crm_interviews
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own crm_interviews" ON crm_interviews
    FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own crm_interviews" ON crm_interviews
    FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- CRM_TASKS POLICIES
-- ============================================
CREATE POLICY "Users can view own crm_tasks" ON crm_tasks
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own crm_tasks" ON crm_tasks
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own crm_tasks" ON crm_tasks
    FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own crm_tasks" ON crm_tasks
    FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- CRM_TAGS POLICIES
-- ============================================
CREATE POLICY "Users can view own crm_tags" ON crm_tags
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own crm_tags" ON crm_tags
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own crm_tags" ON crm_tags
    FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own crm_tags" ON crm_tags
    FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- CRM_ENTITY_TAGS POLICIES
-- ============================================
CREATE POLICY "Users can view own crm_entity_tags" ON crm_entity_tags
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM crm_tags
            WHERE crm_tags.id = crm_entity_tags.tag_id
            AND crm_tags.user_id = auth.uid()
        )
    );
CREATE POLICY "Users can insert own crm_entity_tags" ON crm_entity_tags
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM crm_tags
            WHERE crm_tags.id = crm_entity_tags.tag_id
            AND crm_tags.user_id = auth.uid()
        )
    );
CREATE POLICY "Users can delete own crm_entity_tags" ON crm_entity_tags
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM crm_tags
            WHERE crm_tags.id = crm_entity_tags.tag_id
            AND crm_tags.user_id = auth.uid()
        )
    );


-- ========================================
-- 20250112000008_job_hunt_crm_triggers.sql
-- ========================================

-- ============================================
-- JOB HUNT CRM - TRIGGERS AND FUNCTIONS
-- Based on PRD: job-hunt-crm-prd.md
-- ============================================

-- ============================================
-- AUTO-UPDATE TIMESTAMPS FUNCTION
-- ============================================
CREATE OR REPLACE FUNCTION crm_update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply timestamp triggers to all CRM tables
CREATE TRIGGER update_crm_companies_updated_at
    BEFORE UPDATE ON crm_companies
    FOR EACH ROW EXECUTE FUNCTION crm_update_updated_at();

CREATE TRIGGER update_crm_contacts_updated_at
    BEFORE UPDATE ON crm_contacts
    FOR EACH ROW EXECUTE FUNCTION crm_update_updated_at();

CREATE TRIGGER update_crm_documents_updated_at
    BEFORE UPDATE ON crm_documents
    FOR EACH ROW EXECUTE FUNCTION crm_update_updated_at();

CREATE TRIGGER update_crm_applications_updated_at
    BEFORE UPDATE ON crm_applications
    FOR EACH ROW EXECUTE FUNCTION crm_update_updated_at();

CREATE TRIGGER update_crm_interactions_updated_at
    BEFORE UPDATE ON crm_interactions
    FOR EACH ROW EXECUTE FUNCTION crm_update_updated_at();

CREATE TRIGGER update_crm_interviews_updated_at
    BEFORE UPDATE ON crm_interviews
    FOR EACH ROW EXECUTE FUNCTION crm_update_updated_at();

CREATE TRIGGER update_crm_tasks_updated_at
    BEFORE UPDATE ON crm_tasks
    FOR EACH ROW EXECUTE FUNCTION crm_update_updated_at();

-- ============================================
-- APPLICATION STATUS CHANGE TRACKING
-- ============================================
CREATE OR REPLACE FUNCTION track_crm_application_status_change()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.status IS DISTINCT FROM NEW.status THEN
        INSERT INTO crm_application_status_history (
            application_id,
            previous_status,
            new_status
        ) VALUES (
            NEW.id,
            OLD.status,
            NEW.status
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER track_crm_application_status
    AFTER UPDATE ON crm_applications
    FOR EACH ROW EXECUTE FUNCTION track_crm_application_status_change();

-- ============================================
-- UPDATE CONTACT LAST_CONTACT_DATE
-- ============================================
CREATE OR REPLACE FUNCTION update_crm_contact_last_contact()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.contact_id IS NOT NULL THEN
        UPDATE crm_contacts
        SET last_contact_date = NEW.interaction_date::DATE
        WHERE id = NEW.contact_id
        AND (last_contact_date IS NULL OR last_contact_date < NEW.interaction_date::DATE);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_crm_contact_on_interaction
    AFTER INSERT ON crm_interactions
    FOR EACH ROW EXECUTE FUNCTION update_crm_contact_last_contact();

-- ============================================
-- ENSURE SINGLE DEFAULT DOCUMENT PER TYPE
-- ============================================
CREATE OR REPLACE FUNCTION ensure_single_default_crm_document()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.is_default = TRUE THEN
        UPDATE crm_documents
        SET is_default = FALSE
        WHERE user_id = NEW.user_id
        AND document_type = NEW.document_type
        AND id != NEW.id
        AND is_default = TRUE;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ensure_single_crm_default
    BEFORE INSERT OR UPDATE ON crm_documents
    FOR EACH ROW EXECUTE FUNCTION ensure_single_default_crm_document();

-- ============================================
-- ANALYTICS VIEWS
-- ============================================

-- Application Pipeline Summary
CREATE OR REPLACE VIEW crm_application_pipeline_summary AS
SELECT
    user_id,
    status,
    COUNT(*) as count,
    AVG(fit_score) as avg_fit_score,
    COUNT(CASE WHEN priority = 'high' THEN 1 END) as high_priority_count
FROM crm_applications
WHERE NOT is_archived
GROUP BY user_id, status;

-- Weekly Activity Summary
CREATE OR REPLACE VIEW crm_weekly_activity_summary AS
SELECT
    a.user_id,
    DATE_TRUNC('week', a.created_at) as week_start,
    COUNT(DISTINCT a.id) as applications_submitted,
    COUNT(DISTINCT i.id) as interactions_logged,
    COUNT(DISTINCT int.id) as interviews_scheduled,
    COUNT(DISTINCT t.id) FILTER (WHERE t.status = 'completed') as tasks_completed
FROM crm_applications a
LEFT JOIN crm_interactions i ON a.user_id = i.user_id
    AND DATE_TRUNC('week', i.interaction_date) = DATE_TRUNC('week', a.created_at)
LEFT JOIN crm_interviews int ON a.user_id = int.user_id
    AND DATE_TRUNC('week', int.created_at) = DATE_TRUNC('week', a.created_at)
LEFT JOIN crm_tasks t ON a.user_id = t.user_id
    AND DATE_TRUNC('week', t.completed_at) = DATE_TRUNC('week', a.created_at)
GROUP BY a.user_id, DATE_TRUNC('week', a.created_at);

-- Contact Follow-up Queue
CREATE OR REPLACE VIEW crm_contact_follow_up_queue AS
SELECT
    c.*,
    CURRENT_DATE - c.last_contact_date as days_since_contact,
    CASE
        WHEN c.relationship_strength = 'strong' THEN 30
        WHEN c.relationship_strength = 'warm' THEN 21
        ELSE 14
    END as recommended_follow_up_days
FROM crm_contacts c
WHERE NOT c.is_archived
AND (
    c.last_contact_date IS NULL
    OR CURRENT_DATE - c.last_contact_date >
        CASE
            WHEN c.relationship_strength = 'strong' THEN 30
            WHEN c.relationship_strength = 'warm' THEN 21
            ELSE 14
        END
);

-- Company with aggregated stats view
CREATE OR REPLACE VIEW crm_company_stats AS
SELECT
    c.id,
    c.user_id,
    c.name,
    c.industry,
    c.priority_tier,
    COUNT(DISTINCT ct.id) as contact_count,
    COUNT(DISTINCT a.id) as application_count,
    COUNT(DISTINCT CASE WHEN a.status IN ('offer_received', 'negotiating', 'accepted') THEN a.id END) as active_offers,
    MAX(a.application_date) as last_application_date
FROM crm_companies c
LEFT JOIN crm_contacts ct ON c.id = ct.company_id AND NOT ct.is_archived
LEFT JOIN crm_applications a ON c.id = a.company_id AND NOT a.is_archived
WHERE NOT c.is_archived
GROUP BY c.id, c.user_id, c.name, c.industry, c.priority_tier;


-- ========================================
-- 20250112000009_add_admin_roles.sql
-- ========================================

-- ============================================
-- ADMIN ROLES - SCHEMA CHANGES
-- Add admin and super_admin roles to profiles
-- ============================================

-- Drop existing role constraint
ALTER TABLE profiles
DROP CONSTRAINT IF EXISTS profiles_role_check;

-- Add new role constraint with admin roles
ALTER TABLE profiles
ADD CONSTRAINT profiles_role_check
CHECK (role IN ('job_seeker', 'mentor', 'admin', 'super_admin'));

-- Add is_admin helper column for quick checks
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;

-- Create index for admin lookups
CREATE INDEX IF NOT EXISTS idx_profiles_is_admin ON profiles(is_admin) WHERE is_admin = TRUE;

-- ============================================
-- HELPER FUNCTION: Check if user is admin
-- ============================================
CREATE OR REPLACE FUNCTION public.is_admin(check_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = check_user_id
    AND (role IN ('admin', 'super_admin') OR is_admin = TRUE)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- HELPER FUNCTION: Check if user is super admin
-- ============================================
CREATE OR REPLACE FUNCTION public.is_super_admin(check_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = check_user_id
    AND role = 'super_admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- RLS POLICIES FOR ADMIN ACCESS
-- ============================================

-- Admins can view all profiles
CREATE POLICY "Admins can view all profiles" ON profiles
FOR SELECT USING (
  public.is_admin(auth.uid())
);

-- Super admins can update any profile's role
CREATE POLICY "Super admins can update profiles" ON profiles
FOR UPDATE USING (
  public.is_super_admin(auth.uid())
);

-- Admins can view all career_canvas entries
CREATE POLICY "Admins can view all career_canvas" ON career_canvas
FOR SELECT USING (
  public.is_admin(auth.uid())
);

-- Admins can view all ninety_day_plans
CREATE POLICY "Admins can view all ninety_day_plans" ON ninety_day_plans
FOR SELECT USING (
  public.is_admin(auth.uid())
);

-- Admins can view all weekly_milestones
CREATE POLICY "Admins can view all weekly_milestones" ON weekly_milestones
FOR SELECT USING (
  public.is_admin(auth.uid())
);

-- Admins can view all resume_analyses
CREATE POLICY "Admins can view all resume_analyses" ON resume_analyses
FOR SELECT USING (
  public.is_admin(auth.uid())
);

-- Admins can view all companies
CREATE POLICY "Admins can view all companies" ON companies
FOR SELECT USING (
  public.is_admin(auth.uid())
);

-- Admins can view all ai_usage_tracking
CREATE POLICY "Admins can view all ai_usage" ON ai_usage_tracking
FOR SELECT USING (
  public.is_admin(auth.uid())
);

-- ============================================
-- ASSIGN SUPER ADMIN TO ragid@live.com
-- ============================================
UPDATE profiles
SET role = 'super_admin', is_admin = TRUE
WHERE email = 'ragid@live.com';

-- ============================================
-- ADMIN STATS VIEW
-- ============================================
CREATE OR REPLACE VIEW admin_user_stats AS
SELECT
  p.id,
  p.email,
  p.full_name,
  p.role,
  p.is_admin,
  p.created_at,
  p.updated_at,
  (SELECT COUNT(*) FROM ninety_day_plans WHERE user_id = p.id) as plan_count,
  (SELECT COUNT(*) FROM resume_analyses WHERE user_id = p.id) as resume_count,
  (SELECT COUNT(*) FROM companies WHERE user_id = p.id) as company_count,
  (SELECT COUNT(*) FROM career_canvas WHERE user_id = p.id) as canvas_count
FROM profiles p;

-- RLS for admin stats view
ALTER VIEW admin_user_stats SET (security_invoker = true);


-- ========================================
-- 20250112000010_admin_security_hardening.sql
-- ========================================

-- ============================================
-- ADMIN SECURITY HARDENING
-- Addresses Chief Architect review feedback
-- ============================================
--
-- SUPER_ADMIN RECOVERY PROCEDURE
-- ==============================
-- The initial super_admin (ragid@live.com) is protected from demotion by a trigger.
-- If the email needs to change or recovery is needed:
--
-- 1. Connect to database with elevated privileges (service_role or postgres)
-- 2. Temporarily disable the trigger:
--    ALTER TABLE profiles DISABLE TRIGGER trigger_protect_initial_super_admin;
-- 3. Make necessary changes:
--    UPDATE profiles SET email = 'new@email.com' WHERE email = 'ragid@live.com';
--    -- OR create a new super_admin:
--    UPDATE profiles SET role = 'super_admin', is_admin = TRUE WHERE email = 'new@admin.com';
-- 4. Update the trigger function to protect the new email (if changed):
--    Modify protect_initial_super_admin() function
-- 5. Re-enable the trigger:
--    ALTER TABLE profiles ENABLE TRIGGER trigger_protect_initial_super_admin;
--
-- ============================================

-- ============================================
-- 1. FIX SECURITY DEFINER FUNCTIONS
-- Add explicit search_path to prevent path injection
-- ============================================

-- Recreate is_admin with secure search_path
CREATE OR REPLACE FUNCTION public.is_admin(check_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = check_user_id
    AND (role IN ('admin', 'super_admin') OR is_admin = TRUE)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_temp;

-- Recreate is_super_admin with secure search_path
CREATE OR REPLACE FUNCTION public.is_super_admin(check_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = check_user_id
    AND role = 'super_admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_temp;

-- ============================================
-- 2. BLOCK SELF-ESCALATION OF ROLES
-- Trigger to prevent users from changing their own role
-- Only super_admin can change roles, and only for others
-- ============================================

CREATE OR REPLACE FUNCTION public.prevent_role_self_escalation()
RETURNS TRIGGER AS $$
DECLARE
  current_user_role TEXT;
BEGIN
  -- Get the role of the user making the change
  SELECT role INTO current_user_role
  FROM public.profiles
  WHERE id = auth.uid();

  -- If role or is_admin is being changed
  IF (OLD.role IS DISTINCT FROM NEW.role) OR (OLD.is_admin IS DISTINCT FROM NEW.is_admin) THEN
    -- Block if user is changing their own role
    IF NEW.id = auth.uid() THEN
      RAISE EXCEPTION 'Users cannot change their own role or admin status';
    END IF;

    -- Block if the user making the change is not a super_admin
    IF current_user_role != 'super_admin' THEN
      RAISE EXCEPTION 'Only super_admin can change user roles';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_temp;

-- Create trigger for role change protection
DROP TRIGGER IF EXISTS trigger_prevent_role_self_escalation ON profiles;
CREATE TRIGGER trigger_prevent_role_self_escalation
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_role_self_escalation();

-- ============================================
-- 3. PROTECT INITIAL SUPER_ADMIN ACCOUNT
-- Prevent accidental demotion of ragid@live.com
-- ============================================

CREATE OR REPLACE FUNCTION public.protect_initial_super_admin()
RETURNS TRIGGER AS $$
BEGIN
  -- Protect ragid@live.com from role demotion
  IF OLD.email = 'ragid@live.com' AND OLD.role = 'super_admin' THEN
    IF NEW.role != 'super_admin' OR NEW.is_admin = FALSE THEN
      RAISE EXCEPTION 'Cannot demote the initial super_admin account (ragid@live.com). Contact system administrator for recovery.';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_temp;

-- Create trigger for initial super_admin protection
DROP TRIGGER IF EXISTS trigger_protect_initial_super_admin ON profiles;
CREATE TRIGGER trigger_protect_initial_super_admin
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_initial_super_admin();

-- ============================================
-- 4. BACKFILL is_admin COLUMN FOR LEGACY ROWS
-- Ensure is_admin is consistent with role for all existing users
-- ============================================

UPDATE profiles
SET is_admin = TRUE
WHERE role IN ('admin', 'super_admin') AND (is_admin IS NULL OR is_admin = FALSE);

UPDATE profiles
SET is_admin = FALSE
WHERE role NOT IN ('admin', 'super_admin') AND (is_admin IS NULL OR is_admin = TRUE);

-- ============================================
-- 5. ADD RESTRICTIVE UPDATE POLICY
-- Ensure non-admins can only update non-sensitive fields
-- ============================================

-- Drop any existing user self-update policy that might be too permissive
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

-- Create restrictive self-update policy (excludes role/is_admin changes)
-- Users can update their own non-sensitive fields
CREATE POLICY "Users can update own non-sensitive fields" ON profiles
FOR UPDATE USING (
  auth.uid() = id
)
WITH CHECK (
  auth.uid() = id
  -- The trigger will block role/is_admin changes, but this adds defense-in-depth
);

-- ============================================
-- 6. OPTIMIZE ADMIN VIEWS FOR EFFICIENCY
-- Add aggregate view to avoid N+1 queries
-- ============================================

-- Drop and recreate admin_user_stats with proper aggregation
DROP VIEW IF EXISTS admin_user_stats;
CREATE VIEW admin_user_stats AS
SELECT
  p.id,
  p.email,
  p.full_name,
  p.role,
  p.is_admin,
  p.created_at,
  p.updated_at,
  COALESCE(plans.cnt, 0) as plan_count,
  COALESCE(resumes.cnt, 0) as resume_count,
  COALESCE(companies.cnt, 0) as company_count,
  COALESCE(canvas.cnt, 0) as canvas_count
FROM profiles p
LEFT JOIN (
  SELECT user_id, COUNT(*) as cnt FROM ninety_day_plans GROUP BY user_id
) plans ON plans.user_id = p.id
LEFT JOIN (
  SELECT user_id, COUNT(*) as cnt FROM resume_analyses GROUP BY user_id
) resumes ON resumes.user_id = p.id
LEFT JOIN (
  SELECT user_id, COUNT(*) as cnt FROM companies GROUP BY user_id
) companies ON companies.user_id = p.id
LEFT JOIN (
  SELECT user_id, COUNT(*) as cnt FROM career_canvas GROUP BY user_id
) canvas ON canvas.user_id = p.id;

-- RLS for admin stats view (admins only)
ALTER VIEW admin_user_stats SET (security_invoker = true);

-- ============================================
-- 7. CREATE ADMIN DASHBOARD STATS FUNCTION
-- Single function to get all stats efficiently
-- ============================================

CREATE OR REPLACE FUNCTION public.get_admin_dashboard_stats()
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  -- Only allow admins
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Unauthorized: Admin access required';
  END IF;

  SELECT json_build_object(
    'totalUsers', (SELECT COUNT(*) FROM profiles),
    'totalPlans', (SELECT COUNT(*) FROM ninety_day_plans),
    'totalResumes', (SELECT COUNT(*) FROM resume_analyses),
    'recentSignups', (SELECT COUNT(*) FROM profiles WHERE created_at >= NOW() - INTERVAL '7 days'),
    'usersByRole', (
      SELECT json_object_agg(role, cnt)
      FROM (
        SELECT role, COUNT(*) as cnt
        FROM profiles
        GROUP BY role
      ) r
    )
  ) INTO result;

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_temp;

-- ============================================
-- 8. CREATE PLANS WITH USER INFO VIEW
-- Avoid N+1 when fetching plans
-- ============================================

CREATE OR REPLACE VIEW admin_plans_with_users AS
SELECT
  p.id,
  p.title,
  p.start_date,
  p.end_date,
  p.created_at,
  p.user_id,
  pr.email as user_email,
  pr.full_name as user_name,
  COALESCE(m.total_milestones, 0) as milestone_count,
  COALESCE(m.completed_milestones, 0) as completed_milestones
FROM ninety_day_plans p
JOIN profiles pr ON pr.id = p.user_id
LEFT JOIN (
  SELECT
    plan_id,
    COUNT(*) as total_milestones,
    COUNT(*) FILTER (WHERE status = 'completed') as completed_milestones
  FROM weekly_milestones
  GROUP BY plan_id
) m ON m.plan_id = p.id
ORDER BY p.created_at DESC;

-- RLS for admin plans view (admins only)
ALTER VIEW admin_plans_with_users SET (security_invoker = true);


-- ========================================
-- 20250115000001_session_scheduling_tables.sql
-- ========================================

-- =====================================================
-- Session Scheduling Feature - Tables
-- Migration: 20250115000001_session_scheduling_tables.sql
-- =====================================================

-- Add timezone to profiles if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'timezone'
  ) THEN
    ALTER TABLE profiles ADD COLUMN timezone TEXT DEFAULT 'UTC';
  END IF;
END $$;

-- =====================================================
-- mentorship_sessions table
-- =====================================================
CREATE TABLE IF NOT EXISTS mentorship_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID REFERENCES ninety_day_plans(id) ON DELETE SET NULL,
  host_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  attendee_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  -- Session details
  title TEXT NOT NULL,
  description TEXT,
  session_type TEXT NOT NULL DEFAULT 'one_time' CHECK (session_type IN ('one_time', 'recurring')),
  status TEXT NOT NULL DEFAULT 'proposed' CHECK (status IN ('proposed', 'confirmed', 'cancelled', 'completed', 'no_show')),

  -- Scheduling
  proposed_times JSONB,
  scheduled_start TIMESTAMPTZ,
  scheduled_end TIMESTAMPTZ,
  duration_minutes INTEGER NOT NULL DEFAULT 60,
  timezone TEXT NOT NULL DEFAULT 'UTC',

  -- Recurrence (disabled in UI for MVP)
  recurrence_rule TEXT CHECK (recurrence_rule IN ('weekly', 'biweekly')),
  recurrence_end_date DATE,
  parent_session_id UUID REFERENCES mentorship_sessions(id) ON DELETE SET NULL,

  -- Video conferencing
  meeting_provider TEXT CHECK (meeting_provider IN ('google_meet', 'zoom', 'manual')),
  meeting_link TEXT,
  meeting_id TEXT,

  -- Session tracking
  actual_duration_minutes INTEGER,
  session_notes TEXT,
  outcomes JSONB,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  confirmed_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  cancellation_reason TEXT,

  -- Constraints
  CONSTRAINT different_users CHECK (host_id != attendee_id)
);

-- Indexes for mentorship_sessions
CREATE INDEX IF NOT EXISTS idx_mentorship_sessions_host_id ON mentorship_sessions(host_id);
CREATE INDEX IF NOT EXISTS idx_mentorship_sessions_attendee_id ON mentorship_sessions(attendee_id);
CREATE INDEX IF NOT EXISTS idx_mentorship_sessions_plan_id ON mentorship_sessions(plan_id);
CREATE INDEX IF NOT EXISTS idx_mentorship_sessions_status ON mentorship_sessions(status);
CREATE INDEX IF NOT EXISTS idx_mentorship_sessions_scheduled_start ON mentorship_sessions(scheduled_start);

-- =====================================================
-- calendar_connections table
-- =====================================================
CREATE TABLE IF NOT EXISTS calendar_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  provider TEXT NOT NULL CHECK (provider IN ('google', 'microsoft', 'apple')),

  -- OAuth tokens (encrypted in production)
  access_token TEXT,
  refresh_token TEXT,
  token_expires_at TIMESTAMPTZ,

  -- Calendar info
  calendar_id TEXT,
  calendar_email TEXT,

  -- Status
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_sync_at TIMESTAMPTZ,
  sync_error TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- One active connection per provider per user
  CONSTRAINT unique_user_provider UNIQUE (user_id, provider)
);

-- Indexes for calendar_connections
CREATE INDEX IF NOT EXISTS idx_calendar_connections_user_id ON calendar_connections(user_id);

-- =====================================================
-- session_reminders table
-- =====================================================
CREATE TABLE IF NOT EXISTS session_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES mentorship_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  -- Reminder config
  reminder_type TEXT NOT NULL CHECK (reminder_type IN ('24_hours', '1_hour', 'custom')),
  reminder_time TIMESTAMPTZ NOT NULL,

  -- Delivery status
  email_sent BOOLEAN NOT NULL DEFAULT false,
  email_sent_at TIMESTAMPTZ,
  in_app_sent BOOLEAN NOT NULL DEFAULT false,
  in_app_sent_at TIMESTAMPTZ,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Prevent duplicate reminders
  CONSTRAINT unique_session_user_type UNIQUE (session_id, user_id, reminder_type)
);

-- Indexes for session_reminders
CREATE INDEX IF NOT EXISTS idx_session_reminders_session_id ON session_reminders(session_id);
CREATE INDEX IF NOT EXISTS idx_session_reminders_user_id ON session_reminders(user_id);
CREATE INDEX IF NOT EXISTS idx_session_reminders_reminder_time ON session_reminders(reminder_time);
CREATE INDEX IF NOT EXISTS idx_session_reminders_pending ON session_reminders(reminder_time)
  WHERE email_sent = false;

-- =====================================================
-- Updated_at trigger for all tables
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_mentorship_sessions_updated_at ON mentorship_sessions;
CREATE TRIGGER update_mentorship_sessions_updated_at
  BEFORE UPDATE ON mentorship_sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_calendar_connections_updated_at ON calendar_connections;
CREATE TRIGGER update_calendar_connections_updated_at
  BEFORE UPDATE ON calendar_connections
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- ========================================
-- 20250115000002_session_scheduling_rls.sql
-- ========================================

-- =====================================================
-- Session Scheduling Feature - RLS Policies
-- Migration: 20250115000002_session_scheduling_rls.sql
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE mentorship_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_reminders ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- mentorship_sessions policies
-- =====================================================

-- SELECT: Users can view sessions where they are host or attendee
DROP POLICY IF EXISTS "Users view own sessions" ON mentorship_sessions;
CREATE POLICY "Users view own sessions"
  ON mentorship_sessions FOR SELECT
  USING (host_id = auth.uid() OR attendee_id = auth.uid());

-- INSERT: Only hosts can create sessions (must be authenticated)
DROP POLICY IF EXISTS "Hosts create sessions" ON mentorship_sessions;
CREATE POLICY "Hosts create sessions"
  ON mentorship_sessions FOR INSERT
  WITH CHECK (host_id = auth.uid());

-- UPDATE: Both host and attendee can update (for confirm, cancel, complete)
DROP POLICY IF EXISTS "Participants update sessions" ON mentorship_sessions;
CREATE POLICY "Participants update sessions"
  ON mentorship_sessions FOR UPDATE
  USING (host_id = auth.uid() OR attendee_id = auth.uid());

-- DELETE: Host can delete any status; Attendee can delete proposed/cancelled only
DROP POLICY IF EXISTS "Host deletes sessions" ON mentorship_sessions;
CREATE POLICY "Host deletes sessions"
  ON mentorship_sessions FOR DELETE
  USING (host_id = auth.uid());

DROP POLICY IF EXISTS "Attendee deletes sessions" ON mentorship_sessions;
CREATE POLICY "Attendee deletes sessions"
  ON mentorship_sessions FOR DELETE
  USING (
    attendee_id = auth.uid()
    AND status IN ('proposed', 'cancelled')
  );

-- =====================================================
-- calendar_connections policies
-- =====================================================

-- SELECT: Users can only view their own connections
DROP POLICY IF EXISTS "Users view own calendar connections" ON calendar_connections;
CREATE POLICY "Users view own calendar connections"
  ON calendar_connections FOR SELECT
  USING (user_id = auth.uid());

-- INSERT: Users can only create their own connections
DROP POLICY IF EXISTS "Users create own calendar connections" ON calendar_connections;
CREATE POLICY "Users create own calendar connections"
  ON calendar_connections FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- UPDATE: Users can only update their own connections
DROP POLICY IF EXISTS "Users update own calendar connections" ON calendar_connections;
CREATE POLICY "Users update own calendar connections"
  ON calendar_connections FOR UPDATE
  USING (user_id = auth.uid());

-- DELETE: Users can only delete their own connections
DROP POLICY IF EXISTS "Users delete own calendar connections" ON calendar_connections;
CREATE POLICY "Users delete own calendar connections"
  ON calendar_connections FOR DELETE
  USING (user_id = auth.uid());

-- =====================================================
-- session_reminders policies
-- =====================================================

-- SELECT: Users can view their own reminders
DROP POLICY IF EXISTS "Users view own reminders" ON session_reminders;
CREATE POLICY "Users view own reminders"
  ON session_reminders FOR SELECT
  USING (user_id = auth.uid());

-- INSERT: Users can create reminders for sessions they're part of
DROP POLICY IF EXISTS "Users insert own reminders" ON session_reminders;
CREATE POLICY "Users insert own reminders"
  ON session_reminders FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM mentorship_sessions ms
      WHERE ms.id = session_id
      AND (ms.host_id = auth.uid() OR ms.attendee_id = auth.uid())
    )
  );

-- UPDATE: Users can update their own reminders
DROP POLICY IF EXISTS "Users update own reminders" ON session_reminders;
CREATE POLICY "Users update own reminders"
  ON session_reminders FOR UPDATE
  USING (user_id = auth.uid());

-- DELETE: Users can delete their own reminders
DROP POLICY IF EXISTS "Users delete own reminders" ON session_reminders;
CREATE POLICY "Users delete own reminders"
  ON session_reminders FOR DELETE
  USING (user_id = auth.uid());

-- Service role can manage all reminders (for Edge Functions)
DROP POLICY IF EXISTS "Service role manages reminders" ON session_reminders;
CREATE POLICY "Service role manages reminders"
  ON session_reminders FOR ALL
  USING (auth.role() = 'service_role');


