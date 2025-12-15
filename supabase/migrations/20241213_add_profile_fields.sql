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
