-- Migration: Enhance resume_analyses table with additional analysis fields
-- Date: 2025-01-11
-- Description: Add new columns for enhanced resume analysis (target country, summary, experience level, skills, role recommendations, job search approach, 90-day strategy)

-- Add new columns to resume_analyses table
ALTER TABLE resume_analyses
ADD COLUMN IF NOT EXISTS target_country TEXT DEFAULT 'United Arab Emirates',
ADD COLUMN IF NOT EXISTS summary TEXT,
ADD COLUMN IF NOT EXISTS experience_level TEXT,
ADD COLUMN IF NOT EXISTS skills_identified JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS role_recommendations JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS job_search_approach JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS ninety_day_strategy JSONB DEFAULT '{}'::jsonb;

-- Add comment for documentation
COMMENT ON COLUMN resume_analyses.target_country IS 'Target country for job search analysis';
COMMENT ON COLUMN resume_analyses.summary IS 'Brief executive summary of the candidate profile';
COMMENT ON COLUMN resume_analyses.experience_level IS 'Entry-level, Mid-level, Senior, or Executive';
COMMENT ON COLUMN resume_analyses.skills_identified IS 'Array of all technical and soft skills found';
COMMENT ON COLUMN resume_analyses.role_recommendations IS 'Array of suitable job roles for the candidate';
COMMENT ON COLUMN resume_analyses.job_search_approach IS 'Array of strategic job search recommendations';
COMMENT ON COLUMN resume_analyses.ninety_day_strategy IS 'JSON object with overview and weekly action items';
