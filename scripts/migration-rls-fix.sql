-- =====================================================
-- RLS Policy Fixes for Session Scheduling
-- Run this in Supabase SQL Editor:
-- https://supabase.com/dashboard/project/ybrpblehwfneqenlitgo/sql/new
-- =====================================================

-- =====================================================
-- 1. FIX session_reminders POLICIES
-- Issue: Only SELECT policy exists, blocking INSERT from createSessionReminders
-- =====================================================

-- Allow users to insert reminders for their own sessions
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

-- Allow users to update their own reminders (mark as sent, etc.)
DROP POLICY IF EXISTS "Users update own reminders" ON session_reminders;
CREATE POLICY "Users update own reminders"
  ON session_reminders FOR UPDATE
  USING (user_id = auth.uid());

-- Allow users to delete their own reminders
DROP POLICY IF EXISTS "Users delete own reminders" ON session_reminders;
CREATE POLICY "Users delete own reminders"
  ON session_reminders FOR DELETE
  USING (user_id = auth.uid());

-- Allow service role to manage all reminders (for Edge Functions)
DROP POLICY IF EXISTS "Service role manages reminders" ON session_reminders;
CREATE POLICY "Service role manages reminders"
  ON session_reminders FOR ALL
  USING (auth.role() = 'service_role');

-- =====================================================
-- 2. FIX mentorship_sessions POLICIES
-- Issue: Attendee can't delete/cancel sessions they're part of
-- =====================================================

-- Allow attendee to delete sessions (only proposed/cancelled status)
DROP POLICY IF EXISTS "Attendee deletes sessions" ON mentorship_sessions;
CREATE POLICY "Attendee deletes sessions"
  ON mentorship_sessions FOR DELETE
  USING (
    attendee_id = auth.uid()
    AND status IN ('proposed', 'cancelled')
  );

-- =====================================================
-- 3. Verify policies are applied
-- =====================================================

-- List all policies on session_reminders
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'session_reminders';

-- List all policies on mentorship_sessions
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'mentorship_sessions';
