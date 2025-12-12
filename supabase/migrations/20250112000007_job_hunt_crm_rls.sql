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
