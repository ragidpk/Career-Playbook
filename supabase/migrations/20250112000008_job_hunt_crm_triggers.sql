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
