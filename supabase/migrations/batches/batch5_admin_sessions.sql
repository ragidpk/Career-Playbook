-- BATCH5_ADMIN_SESSIONS
-- Run this in Supabase SQL Editor

-- ============================================
-- 20250112000009_add_admin_roles.sql
-- ============================================

-- ============================================
-- ADMIN ROLES - SCHEMA CHANGES
-- Add admin and super_admin roles to profiles
-- ============================================

-- Drop existing role constraint
ALTER TABLE profiles
DROP CONSTRAINT IF EXISTS profiles_role_check;

-- Add new role constraint with admin roles
ALTER TABLE profiles
ADD CONSTRAINT profiles_role_check
CHECK (role IN ('job_seeker', 'mentor', 'admin', 'super_admin'));

-- Add is_admin helper column for quick checks
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;

-- Create index for admin lookups
CREATE INDEX IF NOT EXISTS idx_profiles_is_admin ON profiles(is_admin) WHERE is_admin = TRUE;

-- ============================================
-- HELPER FUNCTION: Check if user is admin
-- ============================================
CREATE OR REPLACE FUNCTION public.is_admin(check_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = check_user_id
    AND (role IN ('admin', 'super_admin') OR is_admin = TRUE)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- HELPER FUNCTION: Check if user is super admin
-- ============================================
CREATE OR REPLACE FUNCTION public.is_super_admin(check_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = check_user_id
    AND role = 'super_admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- RLS POLICIES FOR ADMIN ACCESS
-- ============================================

-- Admins can view all profiles
CREATE POLICY "Admins can view all profiles" ON profiles
FOR SELECT USING (
  public.is_admin(auth.uid())
);

-- Super admins can update any profile's role
CREATE POLICY "Super admins can update profiles" ON profiles
FOR UPDATE USING (
  public.is_super_admin(auth.uid())
);

-- Admins can view all career_canvas entries
CREATE POLICY "Admins can view all career_canvas" ON career_canvas
FOR SELECT USING (
  public.is_admin(auth.uid())
);

-- Admins can view all ninety_day_plans
CREATE POLICY "Admins can view all ninety_day_plans" ON ninety_day_plans
FOR SELECT USING (
  public.is_admin(auth.uid())
);

-- Admins can view all weekly_milestones
CREATE POLICY "Admins can view all weekly_milestones" ON weekly_milestones
FOR SELECT USING (
  public.is_admin(auth.uid())
);

-- Admins can view all resume_analyses
CREATE POLICY "Admins can view all resume_analyses" ON resume_analyses
FOR SELECT USING (
  public.is_admin(auth.uid())
);

-- Admins can view all companies
CREATE POLICY "Admins can view all companies" ON companies
FOR SELECT USING (
  public.is_admin(auth.uid())
);

-- Admins can view all ai_usage_tracking
CREATE POLICY "Admins can view all ai_usage" ON ai_usage_tracking
FOR SELECT USING (
  public.is_admin(auth.uid())
);

-- ============================================
-- ASSIGN SUPER ADMIN TO ragid@live.com
-- ============================================
UPDATE profiles
SET role = 'super_admin', is_admin = TRUE
WHERE email = 'ragid@live.com';

-- ============================================
-- ADMIN STATS VIEW
-- ============================================
CREATE OR REPLACE VIEW admin_user_stats AS
SELECT
  p.id,
  p.email,
  p.full_name,
  p.role,
  p.is_admin,
  p.created_at,
  p.updated_at,
  (SELECT COUNT(*) FROM ninety_day_plans WHERE user_id = p.id) as plan_count,
  (SELECT COUNT(*) FROM resume_analyses WHERE user_id = p.id) as resume_count,
  (SELECT COUNT(*) FROM companies WHERE user_id = p.id) as company_count,
  (SELECT COUNT(*) FROM career_canvas WHERE user_id = p.id) as canvas_count
FROM profiles p;

-- RLS for admin stats view
ALTER VIEW admin_user_stats SET (security_invoker = true);


-- ============================================
-- 20250112000010_admin_security_hardening.sql
-- ============================================

-- ============================================
-- ADMIN SECURITY HARDENING
-- Addresses Chief Architect review feedback
-- ============================================
--
-- SUPER_ADMIN RECOVERY PROCEDURE
-- ==============================
-- The initial super_admin (ragid@live.com) is protected from demotion by a trigger.
-- If the email needs to change or recovery is needed:
--
-- 1. Connect to database with elevated privileges (service_role or postgres)
-- 2. Temporarily disable the trigger:
--    ALTER TABLE profiles DISABLE TRIGGER trigger_protect_initial_super_admin;
-- 3. Make necessary changes:
--    UPDATE profiles SET email = 'new@email.com' WHERE email = 'ragid@live.com';
--    -- OR create a new super_admin:
--    UPDATE profiles SET role = 'super_admin', is_admin = TRUE WHERE email = 'new@admin.com';
-- 4. Update the trigger function to protect the new email (if changed):
--    Modify protect_initial_super_admin() function
-- 5. Re-enable the trigger:
--    ALTER TABLE profiles ENABLE TRIGGER trigger_protect_initial_super_admin;
--
-- ============================================

-- ============================================
-- 1. FIX SECURITY DEFINER FUNCTIONS
-- Add explicit search_path to prevent path injection
-- ============================================

-- Recreate is_admin with secure search_path
CREATE OR REPLACE FUNCTION public.is_admin(check_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = check_user_id
    AND (role IN ('admin', 'super_admin') OR is_admin = TRUE)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_temp;

-- Recreate is_super_admin with secure search_path
CREATE OR REPLACE FUNCTION public.is_super_admin(check_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = check_user_id
    AND role = 'super_admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_temp;

-- ============================================
-- 2. BLOCK SELF-ESCALATION OF ROLES
-- Trigger to prevent users from changing their own role
-- Only super_admin can change roles, and only for others
-- ============================================

CREATE OR REPLACE FUNCTION public.prevent_role_self_escalation()
RETURNS TRIGGER AS $$
DECLARE
  current_user_role TEXT;
BEGIN
  -- Get the role of the user making the change
  SELECT role INTO current_user_role
  FROM public.profiles
  WHERE id = auth.uid();

  -- If role or is_admin is being changed
  IF (OLD.role IS DISTINCT FROM NEW.role) OR (OLD.is_admin IS DISTINCT FROM NEW.is_admin) THEN
    -- Block if user is changing their own role
    IF NEW.id = auth.uid() THEN
      RAISE EXCEPTION 'Users cannot change their own role or admin status';
    END IF;

    -- Block if the user making the change is not a super_admin
    IF current_user_role != 'super_admin' THEN
      RAISE EXCEPTION 'Only super_admin can change user roles';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_temp;

-- Create trigger for role change protection
DROP TRIGGER IF EXISTS trigger_prevent_role_self_escalation ON profiles;
CREATE TRIGGER trigger_prevent_role_self_escalation
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_role_self_escalation();

-- ============================================
-- 3. PROTECT INITIAL SUPER_ADMIN ACCOUNT
-- Prevent accidental demotion of ragid@live.com
-- ============================================

CREATE OR REPLACE FUNCTION public.protect_initial_super_admin()
RETURNS TRIGGER AS $$
BEGIN
  -- Protect ragid@live.com from role demotion
  IF OLD.email = 'ragid@live.com' AND OLD.role = 'super_admin' THEN
    IF NEW.role != 'super_admin' OR NEW.is_admin = FALSE THEN
      RAISE EXCEPTION 'Cannot demote the initial super_admin account (ragid@live.com). Contact system administrator for recovery.';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_temp;

-- Create trigger for initial super_admin protection
DROP TRIGGER IF EXISTS trigger_protect_initial_super_admin ON profiles;
CREATE TRIGGER trigger_protect_initial_super_admin
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_initial_super_admin();

-- ============================================
-- 4. BACKFILL is_admin COLUMN FOR LEGACY ROWS
-- Ensure is_admin is consistent with role for all existing users
-- ============================================

UPDATE profiles
SET is_admin = TRUE
WHERE role IN ('admin', 'super_admin') AND (is_admin IS NULL OR is_admin = FALSE);

UPDATE profiles
SET is_admin = FALSE
WHERE role NOT IN ('admin', 'super_admin') AND (is_admin IS NULL OR is_admin = TRUE);

-- ============================================
-- 5. ADD RESTRICTIVE UPDATE POLICY
-- Ensure non-admins can only update non-sensitive fields
-- ============================================

-- Drop any existing user self-update policy that might be too permissive
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

-- Create restrictive self-update policy (excludes role/is_admin changes)
-- Users can update their own non-sensitive fields
CREATE POLICY "Users can update own non-sensitive fields" ON profiles
FOR UPDATE USING (
  auth.uid() = id
)
WITH CHECK (
  auth.uid() = id
  -- The trigger will block role/is_admin changes, but this adds defense-in-depth
);

-- ============================================
-- 6. OPTIMIZE ADMIN VIEWS FOR EFFICIENCY
-- Add aggregate view to avoid N+1 queries
-- ============================================

-- Drop and recreate admin_user_stats with proper aggregation
DROP VIEW IF EXISTS admin_user_stats;
CREATE VIEW admin_user_stats AS
SELECT
  p.id,
  p.email,
  p.full_name,
  p.role,
  p.is_admin,
  p.created_at,
  p.updated_at,
  COALESCE(plans.cnt, 0) as plan_count,
  COALESCE(resumes.cnt, 0) as resume_count,
  COALESCE(companies.cnt, 0) as company_count,
  COALESCE(canvas.cnt, 0) as canvas_count
FROM profiles p
LEFT JOIN (
  SELECT user_id, COUNT(*) as cnt FROM ninety_day_plans GROUP BY user_id
) plans ON plans.user_id = p.id
LEFT JOIN (
  SELECT user_id, COUNT(*) as cnt FROM resume_analyses GROUP BY user_id
) resumes ON resumes.user_id = p.id
LEFT JOIN (
  SELECT user_id, COUNT(*) as cnt FROM companies GROUP BY user_id
) companies ON companies.user_id = p.id
LEFT JOIN (
  SELECT user_id, COUNT(*) as cnt FROM career_canvas GROUP BY user_id
) canvas ON canvas.user_id = p.id;

-- RLS for admin stats view (admins only)
ALTER VIEW admin_user_stats SET (security_invoker = true);

-- ============================================
-- 7. CREATE ADMIN DASHBOARD STATS FUNCTION
-- Single function to get all stats efficiently
-- ============================================

CREATE OR REPLACE FUNCTION public.get_admin_dashboard_stats()
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  -- Only allow admins
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Unauthorized: Admin access required';
  END IF;

  SELECT json_build_object(
    'totalUsers', (SELECT COUNT(*) FROM profiles),
    'totalPlans', (SELECT COUNT(*) FROM ninety_day_plans),
    'totalResumes', (SELECT COUNT(*) FROM resume_analyses),
    'recentSignups', (SELECT COUNT(*) FROM profiles WHERE created_at >= NOW() - INTERVAL '7 days'),
    'usersByRole', (
      SELECT json_object_agg(role, cnt)
      FROM (
        SELECT role, COUNT(*) as cnt
        FROM profiles
        GROUP BY role
      ) r
    )
  ) INTO result;

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_temp;

-- ============================================
-- 8. CREATE PLANS WITH USER INFO VIEW
-- Avoid N+1 when fetching plans
-- ============================================

CREATE OR REPLACE VIEW admin_plans_with_users AS
SELECT
  p.id,
  p.title,
  p.start_date,
  p.end_date,
  p.created_at,
  p.user_id,
  pr.email as user_email,
  pr.full_name as user_name,
  COALESCE(m.total_milestones, 0) as milestone_count,
  COALESCE(m.completed_milestones, 0) as completed_milestones
FROM ninety_day_plans p
JOIN profiles pr ON pr.id = p.user_id
LEFT JOIN (
  SELECT
    plan_id,
    COUNT(*) as total_milestones,
    COUNT(*) FILTER (WHERE status = 'completed') as completed_milestones
  FROM weekly_milestones
  GROUP BY plan_id
) m ON m.plan_id = p.id
ORDER BY p.created_at DESC;

-- RLS for admin plans view (admins only)
ALTER VIEW admin_plans_with_users SET (security_invoker = true);


-- ============================================
-- 20250115000001_session_scheduling_tables.sql
-- ============================================

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


-- ============================================
-- 20250115000002_session_scheduling_rls.sql
-- ============================================

-- =====================================================
-- Session Scheduling Feature - RLS Policies
-- Migration: 20250115000002_session_scheduling_rls.sql
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE mentorship_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_reminders ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- mentorship_sessions policies
-- =====================================================

-- SELECT: Users can view sessions where they are host or attendee
DROP POLICY IF EXISTS "Users view own sessions" ON mentorship_sessions;
CREATE POLICY "Users view own sessions"
  ON mentorship_sessions FOR SELECT
  USING (host_id = auth.uid() OR attendee_id = auth.uid());

-- INSERT: Only hosts can create sessions (must be authenticated)
DROP POLICY IF EXISTS "Hosts create sessions" ON mentorship_sessions;
CREATE POLICY "Hosts create sessions"
  ON mentorship_sessions FOR INSERT
  WITH CHECK (host_id = auth.uid());

-- UPDATE: Both host and attendee can update (for confirm, cancel, complete)
DROP POLICY IF EXISTS "Participants update sessions" ON mentorship_sessions;
CREATE POLICY "Participants update sessions"
  ON mentorship_sessions FOR UPDATE
  USING (host_id = auth.uid() OR attendee_id = auth.uid());

-- DELETE: Host can delete any status; Attendee can delete proposed/cancelled only
DROP POLICY IF EXISTS "Host deletes sessions" ON mentorship_sessions;
CREATE POLICY "Host deletes sessions"
  ON mentorship_sessions FOR DELETE
  USING (host_id = auth.uid());

DROP POLICY IF EXISTS "Attendee deletes sessions" ON mentorship_sessions;
CREATE POLICY "Attendee deletes sessions"
  ON mentorship_sessions FOR DELETE
  USING (
    attendee_id = auth.uid()
    AND status IN ('proposed', 'cancelled')
  );

-- =====================================================
-- calendar_connections policies
-- =====================================================

-- SELECT: Users can only view their own connections
DROP POLICY IF EXISTS "Users view own calendar connections" ON calendar_connections;
CREATE POLICY "Users view own calendar connections"
  ON calendar_connections FOR SELECT
  USING (user_id = auth.uid());

-- INSERT: Users can only create their own connections
DROP POLICY IF EXISTS "Users create own calendar connections" ON calendar_connections;
CREATE POLICY "Users create own calendar connections"
  ON calendar_connections FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- UPDATE: Users can only update their own connections
DROP POLICY IF EXISTS "Users update own calendar connections" ON calendar_connections;
CREATE POLICY "Users update own calendar connections"
  ON calendar_connections FOR UPDATE
  USING (user_id = auth.uid());

-- DELETE: Users can only delete their own connections
DROP POLICY IF EXISTS "Users delete own calendar connections" ON calendar_connections;
CREATE POLICY "Users delete own calendar connections"
  ON calendar_connections FOR DELETE
  USING (user_id = auth.uid());

-- =====================================================
-- session_reminders policies
-- =====================================================

-- SELECT: Users can view their own reminders
DROP POLICY IF EXISTS "Users view own reminders" ON session_reminders;
CREATE POLICY "Users view own reminders"
  ON session_reminders FOR SELECT
  USING (user_id = auth.uid());

-- INSERT: Users can create reminders for sessions they're part of
DROP POLICY IF EXISTS "Users insert own reminders" ON session_reminders;
CREATE POLICY "Users insert own reminders"
  ON session_reminders FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM mentorship_sessions ms
      WHERE ms.id = session_id
      AND (ms.host_id = auth.uid() OR ms.attendee_id = auth.uid())
    )
  );

-- UPDATE: Users can update their own reminders
DROP POLICY IF EXISTS "Users update own reminders" ON session_reminders;
CREATE POLICY "Users update own reminders"
  ON session_reminders FOR UPDATE
  USING (user_id = auth.uid());

-- DELETE: Users can delete their own reminders
DROP POLICY IF EXISTS "Users delete own reminders" ON session_reminders;
CREATE POLICY "Users delete own reminders"
  ON session_reminders FOR DELETE
  USING (user_id = auth.uid());

-- Service role can manage all reminders (for Edge Functions)
DROP POLICY IF EXISTS "Service role manages reminders" ON session_reminders;
CREATE POLICY "Service role manages reminders"
  ON session_reminders FOR ALL
  USING (auth.role() = 'service_role');


