-- User Job Recommendations Table
-- Stores AI-generated job recommendations to avoid regenerating on every visit

CREATE TABLE IF NOT EXISTS user_job_recommendations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

    -- Input parameters used for generation
    target_role TEXT NOT NULL,
    current_role TEXT,
    skills TEXT,
    locations TEXT[],
    seniority TEXT,
    industry TEXT,
    work_type TEXT,

    -- AI-generated recommendations
    best_match_titles TEXT[] NOT NULL DEFAULT '{}',
    adjacent_titles TEXT[] NOT NULL DEFAULT '{}',
    title_variations TEXT[] NOT NULL DEFAULT '{}',
    keyword_pack TEXT[] NOT NULL DEFAULT '{}',
    positioning_summary TEXT,

    -- Metadata
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Only keep one recommendation per user (can be regenerated)
    CONSTRAINT unique_user_recommendations UNIQUE (user_id)
);

-- Index for quick user lookup
CREATE INDEX idx_user_job_recommendations_user ON user_job_recommendations(user_id);

-- Enable RLS
ALTER TABLE user_job_recommendations ENABLE ROW LEVEL SECURITY;

-- Users can only access their own recommendations
CREATE POLICY "Users can view own recommendations"
    ON user_job_recommendations FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own recommendations"
    ON user_job_recommendations FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own recommendations"
    ON user_job_recommendations FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own recommendations"
    ON user_job_recommendations FOR DELETE
    USING (auth.uid() = user_id);

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_job_recommendations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_job_recommendations_updated_at
    BEFORE UPDATE ON user_job_recommendations
    FOR EACH ROW
    EXECUTE FUNCTION update_job_recommendations_updated_at();
