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
