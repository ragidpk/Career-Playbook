-- ============================================
-- EXTERNAL JOBS - Shared Job Discovery Index
-- Phase 1: Discovery tables for job board unification
-- ============================================

-- Shared job discovery index (provider-sourced or manual import)
CREATE TABLE IF NOT EXISTS external_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider VARCHAR(50) NOT NULL,              -- 'jooble', 'manual_url', 'legacy', etc.
    provider_job_id VARCHAR(255),               -- External ID from provider
    canonical_url TEXT,                         -- Normalized/dedupe URL
    title VARCHAR(500) NOT NULL,
    company_name VARCHAR(255) NOT NULL,
    location VARCHAR(255),
    location_type location_type_enum,           -- remote/hybrid/onsite (reuse existing enum)
    description_snippet TEXT,                   -- Short preview
    posted_at TIMESTAMPTZ,
    apply_url TEXT,
    salary_min INTEGER,
    salary_max INTEGER,
    salary_currency VARCHAR(3) DEFAULT 'USD',
    raw JSONB,                                  -- Original provider data
    ingested_at TIMESTAMPTZ DEFAULT NOW(),

    -- Unique constraints for deduplication
    CONSTRAINT unique_provider_job UNIQUE (provider, provider_job_id)
);

-- Partial unique index for canonical_url (only when not null)
CREATE UNIQUE INDEX IF NOT EXISTS idx_external_jobs_canonical_url
    ON external_jobs(canonical_url)
    WHERE canonical_url IS NOT NULL;

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_external_jobs_posted ON external_jobs(posted_at DESC);
CREATE INDEX IF NOT EXISTS idx_external_jobs_location_type ON external_jobs(location_type);
CREATE INDEX IF NOT EXISTS idx_external_jobs_company ON external_jobs(company_name);
CREATE INDEX IF NOT EXISTS idx_external_jobs_provider ON external_jobs(provider);

-- Full-text search index
CREATE INDEX IF NOT EXISTS idx_external_jobs_search ON external_jobs
    USING GIN (to_tsvector('english', title || ' ' || COALESCE(description_snippet, '')));

-- ============================================
-- USER_JOB_ITEMS - Per-user save/hide state
-- ============================================

CREATE TABLE IF NOT EXISTS user_job_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    external_job_id UUID NOT NULL REFERENCES external_jobs(id) ON DELETE CASCADE,
    state VARCHAR(20) NOT NULL DEFAULT 'saved'
        CHECK (state IN ('saved', 'hidden', 'applied')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT unique_user_job UNIQUE (user_id, external_job_id)
);

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_user_job_items_user ON user_job_items(user_id);
CREATE INDEX IF NOT EXISTS idx_user_job_items_state ON user_job_items(user_id, state);
CREATE INDEX IF NOT EXISTS idx_user_job_items_external_job ON user_job_items(external_job_id);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

-- external_jobs: Read-only for authenticated users, write for service role only
ALTER TABLE external_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read external jobs"
    ON external_jobs FOR SELECT
    TO authenticated
    USING (true);

-- Note: INSERT/UPDATE/DELETE only via service_role (no policy = denied for anon/authenticated)

-- user_job_items: Users manage their own rows
ALTER TABLE user_job_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own job items"
    ON user_job_items FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own job items"
    ON user_job_items FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own job items"
    ON user_job_items FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own job items"
    ON user_job_items FOR DELETE
    USING (auth.uid() = user_id);

-- ============================================
-- TRIGGER: Update updated_at on user_job_items
-- ============================================

CREATE TRIGGER update_user_job_items_updated_at
    BEFORE UPDATE ON user_job_items
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
