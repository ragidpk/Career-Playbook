-- =====================================================
-- Session Scheduling Feature - Tables
-- Migration: 20250115000001_session_scheduling_tables.sql
-- =====================================================

-- Add timezone to profiles if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'timezone'
  ) THEN
    ALTER TABLE profiles ADD COLUMN timezone TEXT DEFAULT 'UTC';
  END IF;
END $$;

-- =====================================================
-- mentorship_sessions table
-- =====================================================
CREATE TABLE IF NOT EXISTS mentorship_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID REFERENCES ninety_day_plans(id) ON DELETE SET NULL,
  host_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  attendee_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  -- Session details
  title TEXT NOT NULL,
  description TEXT,
  session_type TEXT NOT NULL DEFAULT 'one_time' CHECK (session_type IN ('one_time', 'recurring')),
  status TEXT NOT NULL DEFAULT 'proposed' CHECK (status IN ('proposed', 'confirmed', 'cancelled', 'completed', 'no_show')),

  -- Scheduling
  proposed_times JSONB,
  scheduled_start TIMESTAMPTZ,
  scheduled_end TIMESTAMPTZ,
  duration_minutes INTEGER NOT NULL DEFAULT 60,
  timezone TEXT NOT NULL DEFAULT 'UTC',

  -- Recurrence (disabled in UI for MVP)
  recurrence_rule TEXT CHECK (recurrence_rule IN ('weekly', 'biweekly')),
  recurrence_end_date DATE,
  parent_session_id UUID REFERENCES mentorship_sessions(id) ON DELETE SET NULL,

  -- Video conferencing
  meeting_provider TEXT CHECK (meeting_provider IN ('google_meet', 'zoom', 'manual')),
  meeting_link TEXT,
  meeting_id TEXT,

  -- Session tracking
  actual_duration_minutes INTEGER,
  session_notes TEXT,
  outcomes JSONB,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  confirmed_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  cancellation_reason TEXT,

  -- Constraints
  CONSTRAINT different_users CHECK (host_id != attendee_id)
);

-- Indexes for mentorship_sessions
CREATE INDEX IF NOT EXISTS idx_mentorship_sessions_host_id ON mentorship_sessions(host_id);
CREATE INDEX IF NOT EXISTS idx_mentorship_sessions_attendee_id ON mentorship_sessions(attendee_id);
CREATE INDEX IF NOT EXISTS idx_mentorship_sessions_plan_id ON mentorship_sessions(plan_id);
CREATE INDEX IF NOT EXISTS idx_mentorship_sessions_status ON mentorship_sessions(status);
CREATE INDEX IF NOT EXISTS idx_mentorship_sessions_scheduled_start ON mentorship_sessions(scheduled_start);

-- =====================================================
-- calendar_connections table
-- =====================================================
CREATE TABLE IF NOT EXISTS calendar_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  provider TEXT NOT NULL CHECK (provider IN ('google', 'microsoft', 'apple')),

  -- OAuth tokens (encrypted in production)
  access_token TEXT,
  refresh_token TEXT,
  token_expires_at TIMESTAMPTZ,

  -- Calendar info
  calendar_id TEXT,
  calendar_email TEXT,

  -- Status
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_sync_at TIMESTAMPTZ,
  sync_error TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- One active connection per provider per user
  CONSTRAINT unique_user_provider UNIQUE (user_id, provider)
);

-- Indexes for calendar_connections
CREATE INDEX IF NOT EXISTS idx_calendar_connections_user_id ON calendar_connections(user_id);

-- =====================================================
-- session_reminders table
-- =====================================================
CREATE TABLE IF NOT EXISTS session_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES mentorship_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  -- Reminder config
  reminder_type TEXT NOT NULL CHECK (reminder_type IN ('24_hours', '1_hour', 'custom')),
  reminder_time TIMESTAMPTZ NOT NULL,

  -- Delivery status
  email_sent BOOLEAN NOT NULL DEFAULT false,
  email_sent_at TIMESTAMPTZ,
  in_app_sent BOOLEAN NOT NULL DEFAULT false,
  in_app_sent_at TIMESTAMPTZ,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Prevent duplicate reminders
  CONSTRAINT unique_session_user_type UNIQUE (session_id, user_id, reminder_type)
);

-- Indexes for session_reminders
CREATE INDEX IF NOT EXISTS idx_session_reminders_session_id ON session_reminders(session_id);
CREATE INDEX IF NOT EXISTS idx_session_reminders_user_id ON session_reminders(user_id);
CREATE INDEX IF NOT EXISTS idx_session_reminders_reminder_time ON session_reminders(reminder_time);
CREATE INDEX IF NOT EXISTS idx_session_reminders_pending ON session_reminders(reminder_time)
  WHERE email_sent = false;

-- =====================================================
-- Updated_at trigger for all tables
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_mentorship_sessions_updated_at ON mentorship_sessions;
CREATE TRIGGER update_mentorship_sessions_updated_at
  BEFORE UPDATE ON mentorship_sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_calendar_connections_updated_at ON calendar_connections;
CREATE TRIGGER update_calendar_connections_updated_at
  BEFORE UPDATE ON calendar_connections
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
