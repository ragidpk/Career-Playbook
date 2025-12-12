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
