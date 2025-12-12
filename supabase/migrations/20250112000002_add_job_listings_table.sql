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
