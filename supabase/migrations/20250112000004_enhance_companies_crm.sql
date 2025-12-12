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
