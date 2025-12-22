-- Add job description and skills to companies table for better job tracking
-- This enhances the CRM with detailed job information

-- Add job description column (full description text)
ALTER TABLE companies
ADD COLUMN IF NOT EXISTS job_description TEXT;

-- Add skills column (array of skill names)
ALTER TABLE companies
ADD COLUMN IF NOT EXISTS skills TEXT[];

-- Add comment for documentation
COMMENT ON COLUMN companies.job_description IS 'Full job description text for the position';
COMMENT ON COLUMN companies.skills IS 'Array of required skills for the job';

-- Also add to external_jobs table for storing full descriptions
ALTER TABLE external_jobs
ADD COLUMN IF NOT EXISTS full_description TEXT;

ALTER TABLE external_jobs
ADD COLUMN IF NOT EXISTS skills TEXT[];

COMMENT ON COLUMN external_jobs.full_description IS 'Full job description (if fetched from source)';
COMMENT ON COLUMN external_jobs.skills IS 'Extracted skills from job description';
