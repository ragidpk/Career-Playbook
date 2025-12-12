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
