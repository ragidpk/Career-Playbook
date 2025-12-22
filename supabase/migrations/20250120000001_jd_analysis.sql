-- ============================================
-- JD Analysis Tables
-- For resume vs job description comparison
-- ============================================

-- Store job descriptions for reuse
CREATE TABLE IF NOT EXISTS job_descriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title VARCHAR(500) NOT NULL,
    company VARCHAR(255),
    location VARCHAR(255),
    description TEXT NOT NULL,
    requirements JSONB DEFAULT '[]'::jsonb,
    skills JSONB DEFAULT '[]'::jsonb,
    experience_required VARCHAR(100),
    source_url TEXT,
    source_type VARCHAR(20) CHECK (source_type IN ('url', 'file', 'text')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Store resume vs JD analysis results
CREATE TABLE IF NOT EXISTS resume_jd_analyses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    resume_analysis_id UUID REFERENCES resume_analyses(id) ON DELETE SET NULL,
    job_description_id UUID NOT NULL REFERENCES job_descriptions(id) ON DELETE CASCADE,
    resume_file_name VARCHAR(255),
    resume_text TEXT,
    match_score INTEGER CHECK (match_score >= 0 AND match_score <= 100),
    keyword_analysis JSONB DEFAULT '{}'::jsonb,
    section_analysis JSONB DEFAULT '{}'::jsonb,
    improvements JSONB DEFAULT '[]'::jsonb,
    tailored_summary TEXT,
    action_items JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- Indexes for performance
-- ============================================

CREATE INDEX IF NOT EXISTS idx_job_descriptions_user ON job_descriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_job_descriptions_created ON job_descriptions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_resume_jd_analyses_user ON resume_jd_analyses(user_id);
CREATE INDEX IF NOT EXISTS idx_resume_jd_analyses_score ON resume_jd_analyses(match_score DESC);
CREATE INDEX IF NOT EXISTS idx_resume_jd_analyses_created ON resume_jd_analyses(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_resume_jd_analyses_jd ON resume_jd_analyses(job_description_id);

-- ============================================
-- Row Level Security
-- ============================================

ALTER TABLE job_descriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE resume_jd_analyses ENABLE ROW LEVEL SECURITY;

-- Job descriptions policies
CREATE POLICY "Users can view own job_descriptions"
    ON job_descriptions FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own job_descriptions"
    ON job_descriptions FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own job_descriptions"
    ON job_descriptions FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own job_descriptions"
    ON job_descriptions FOR DELETE
    USING (auth.uid() = user_id);

-- Resume JD analyses policies
CREATE POLICY "Users can view own resume_jd_analyses"
    ON resume_jd_analyses FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own resume_jd_analyses"
    ON resume_jd_analyses FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own resume_jd_analyses"
    ON resume_jd_analyses FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own resume_jd_analyses"
    ON resume_jd_analyses FOR DELETE
    USING (auth.uid() = user_id);

-- ============================================
-- Updated_at trigger for job_descriptions
-- ============================================

CREATE TRIGGER update_job_descriptions_updated_at
    BEFORE UPDATE ON job_descriptions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
