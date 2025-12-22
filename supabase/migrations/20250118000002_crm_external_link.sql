-- ============================================
-- CRM APPLICATIONS - Link to External Jobs
-- Phase 2: Connect CRM to job discovery layer
-- ============================================

-- Add external_job_id reference to crm_applications
ALTER TABLE crm_applications
    ADD COLUMN IF NOT EXISTS external_job_id UUID REFERENCES external_jobs(id) ON DELETE SET NULL;

-- Prevent duplicate tracking per user (same external job can only have one CRM application per user)
CREATE UNIQUE INDEX IF NOT EXISTS idx_crm_app_external_unique
    ON crm_applications(user_id, external_job_id)
    WHERE external_job_id IS NOT NULL;

-- Index for lookup by external job
CREATE INDEX IF NOT EXISTS idx_crm_applications_external_job
    ON crm_applications(external_job_id)
    WHERE external_job_id IS NOT NULL;

-- Optional: Normalized URL for dedupe (when tracking jobs without external_job_id)
ALTER TABLE crm_applications
    ADD COLUMN IF NOT EXISTS canonical_job_url TEXT;

-- Index for canonical URL lookups
CREATE INDEX IF NOT EXISTS idx_crm_applications_canonical_url
    ON crm_applications(canonical_job_url)
    WHERE canonical_job_url IS NOT NULL;
