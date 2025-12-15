-- BATCH4_CRM
-- Run this in Supabase SQL Editor

-- ============================================
-- 20250112000004_enhance_companies_crm.sql
-- ============================================

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


-- ============================================
-- 20250112000005_job_hunt_crm_enums.sql
-- ============================================

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


-- ============================================
-- 20250112000006_job_hunt_crm_tables.sql
-- ============================================

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


-- ============================================
-- 20250112000007_job_hunt_crm_rls.sql
-- ============================================

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


-- ============================================
-- 20250112000008_job_hunt_crm_triggers.sql
-- ============================================

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


