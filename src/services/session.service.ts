// Session Scheduling Service
// Handles mentorship sessions between mentors/accountability partners and job seekers
//
// NOTE: These tables are not in auto-generated database.types.ts yet.
// Types are manually added to database.types.ts (lines 678-858).
// After schema stabilizes, regenerate types with:
//   npx supabase gen types typescript --project-id ybrpblehwfneqenlitgo > src/types/database.types.ts
// Then remove the type assertions below.

import { supabase } from './supabase';
import type {
  MentorshipSession,
  SessionWithProfiles,
  CreateSessionInput,
  ConfirmSessionInput,
  CompleteSessionInput,
  CancelSessionInput,
  SessionFilters,
  CalendarConnection,
  SessionReminder,
} from '../types/session.types';

// Table accessors with type assertions for tables not yet in generated types
// These bypass TypeScript's strict checking while preserving runtime behavior
/* eslint-disable @typescript-eslint/no-explicit-any */
const sessions = () => supabase.from('mentorship_sessions' as any) as any;
const calendars = () => supabase.from('calendar_connections' as any) as any;
const reminders = () => supabase.from('session_reminders' as any) as any;
/* eslint-enable @typescript-eslint/no-explicit-any */

/**
 * Create a new session (proposed by host/mentor)
 * Validates that host and attendee are collaborators before creating.
 */
export async function createSession(
  hostId: string,
  input: CreateSessionInput
): Promise<MentorshipSession> {
  // Validate hostId is provided
  if (!hostId) {
    throw new Error('Host ID is required to create a session');
  }

  // Verify host can schedule with attendee (must be collaborators)
  const canSchedule = await canScheduleWith(hostId, input.attendee_id, input.plan_id);
  if (!canSchedule) {
    throw new Error('Cannot schedule session: you must be a collaborator on a plan with this user');
  }

  const { data, error } = await sessions()
    .insert({
      host_id: hostId,
      attendee_id: input.attendee_id,
      plan_id: input.plan_id || null,
      title: input.title,
      description: input.description || null,
      session_type: input.session_type,
      status: 'proposed',
      proposed_times: input.proposed_times,
      duration_minutes: input.duration_minutes,
      timezone: input.timezone,
      recurrence_rule: input.recurrence_rule || null,
      recurrence_end_date: input.recurrence_end_date || null,
      meeting_provider: input.meeting_provider || null,
      meeting_link: input.meeting_link || null,
    })
    .select()
    .single();

  if (error) throw error;
  return data as MentorshipSession;
}

/**
 * Get all sessions for a user (as host or attendee)
 */
export async function getSessions(
  userId: string,
  filters?: SessionFilters
): Promise<SessionWithProfiles[]> {
  let query = sessions()
    .select(`
      *,
      host:host_id(id, full_name, email),
      attendee:attendee_id(id, full_name, email),
      plan:plan_id(id, title)
    `);

  // Filter by user role
  if (filters?.as_host && !filters?.as_attendee) {
    query = query.eq('host_id', userId);
  } else if (filters?.as_attendee && !filters?.as_host) {
    query = query.eq('attendee_id', userId);
  } else {
    query = query.or(`host_id.eq.${userId},attendee_id.eq.${userId}`);
  }

  // Filter by status
  if (filters?.status && filters.status.length > 0) {
    query = query.in('status', filters.status);
  }

  // Filter by date range
  if (filters?.from_date) {
    query = query.gte('scheduled_start', filters.from_date);
  }
  if (filters?.to_date) {
    query = query.lte('scheduled_start', filters.to_date);
  }

  // Filter by plan
  if (filters?.plan_id) {
    query = query.eq('plan_id', filters.plan_id);
  }

  // Order by scheduled time, then created time
  query = query.order('scheduled_start', { ascending: true, nullsFirst: false });
  query = query.order('created_at', { ascending: false });

  const { data, error } = await query;

  if (error) throw error;
  return (data || []) as SessionWithProfiles[];
}

/**
 * Get a single session by ID
 */
export async function getSessionById(
  sessionId: string
): Promise<SessionWithProfiles | null> {
  const { data, error } = await sessions()
    .select(`
      *,
      host:host_id(id, full_name, email),
      attendee:attendee_id(id, full_name, email),
      plan:plan_id(id, title)
    `)
    .eq('id', sessionId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }
  return data as SessionWithProfiles;
}

/**
 * Get upcoming sessions for a user
 */
export async function getUpcomingSessions(
  userId: string,
  limit: number = 5
): Promise<SessionWithProfiles[]> {
  const now = new Date().toISOString();

  const { data, error } = await sessions()
    .select(`
      *,
      host:host_id(id, full_name, email),
      attendee:attendee_id(id, full_name, email),
      plan:plan_id(id, title)
    `)
    .or(`host_id.eq.${userId},attendee_id.eq.${userId}`)
    .in('status', ['proposed', 'confirmed'])
    .or(`scheduled_start.gte.${now},scheduled_start.is.null`)
    .order('scheduled_start', { ascending: true, nullsFirst: false })
    .limit(limit);

  if (error) throw error;
  return (data || []) as SessionWithProfiles[];
}

/**
 * Get past sessions for a user
 */
export async function getPastSessions(
  userId: string,
  limit: number = 20
): Promise<SessionWithProfiles[]> {
  const { data, error } = await sessions()
    .select(`
      *,
      host:host_id(id, full_name, email),
      attendee:attendee_id(id, full_name, email),
      plan:plan_id(id, title)
    `)
    .or(`host_id.eq.${userId},attendee_id.eq.${userId}`)
    .in('status', ['completed', 'no_show', 'cancelled'])
    .order('scheduled_start', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return (data || []) as SessionWithProfiles[];
}

/**
 * Confirm a session (attendee selects a proposed time)
 */
export async function confirmSession(
  input: ConfirmSessionInput
): Promise<MentorshipSession> {
  const { data, error } = await sessions()
    .update({
      status: 'confirmed',
      scheduled_start: input.selected_time.start,
      scheduled_end: input.selected_time.end,
      confirmed_at: new Date().toISOString(),
    })
    .eq('id', input.session_id)
    .select()
    .single();

  if (error) throw error;
  return data as MentorshipSession;
}

/**
 * Cancel a session
 */
export async function cancelSession(
  input: CancelSessionInput
): Promise<MentorshipSession> {
  const { data, error } = await sessions()
    .update({
      status: 'cancelled',
      cancelled_at: new Date().toISOString(),
      cancellation_reason: input.reason || null,
    })
    .eq('id', input.session_id)
    .select()
    .single();

  if (error) throw error;
  return data as MentorshipSession;
}

/**
 * Complete a session with notes and outcomes
 */
export async function completeSession(
  input: CompleteSessionInput
): Promise<MentorshipSession> {
  const { data, error } = await sessions()
    .update({
      status: 'completed',
      completed_at: new Date().toISOString(),
      session_notes: input.session_notes || null,
      outcomes: input.outcomes || null,
      actual_duration_minutes: input.actual_duration_minutes || null,
    })
    .eq('id', input.session_id)
    .select()
    .single();

  if (error) throw error;
  return data as MentorshipSession;
}

/**
 * Update session notes (can be done after completion too)
 */
export async function updateSessionNotes(
  sessionId: string,
  notes: string
): Promise<MentorshipSession> {
  const { data, error } = await sessions()
    .update({ session_notes: notes })
    .eq('id', sessionId)
    .select()
    .single();

  if (error) throw error;
  return data as MentorshipSession;
}

/**
 * Mark session as no-show
 */
export async function markSessionNoShow(
  sessionId: string
): Promise<MentorshipSession> {
  const { data, error } = await sessions()
    .update({
      status: 'no_show',
      completed_at: new Date().toISOString(),
    })
    .eq('id', sessionId)
    .select()
    .single();

  if (error) throw error;
  return data as MentorshipSession;
}

/**
 * Delete a session (only if proposed/cancelled)
 */
export async function deleteSession(sessionId: string): Promise<void> {
  const { error } = await sessions()
    .delete()
    .eq('id', sessionId)
    .in('status', ['proposed', 'cancelled']);

  if (error) throw error;
}

// ============================================
// Calendar Connection Functions
// ============================================

/**
 * Get all calendar connections for a user
 */
export async function getCalendarConnections(
  userId: string
): Promise<CalendarConnection[]> {
  const { data, error } = await calendars()
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data || []) as CalendarConnection[];
}

/**
 * Get active calendar connection by provider
 */
export async function getCalendarConnection(
  userId: string,
  provider: 'google' | 'microsoft' | 'apple'
): Promise<CalendarConnection | null> {
  const { data, error } = await calendars()
    .select('*')
    .eq('user_id', userId)
    .eq('provider', provider)
    .eq('is_active', true)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }
  return data as CalendarConnection;
}

/**
 * Disconnect a calendar
 */
export async function disconnectCalendar(
  connectionId: string
): Promise<void> {
  const { error } = await calendars()
    .update({ is_active: false })
    .eq('id', connectionId);

  if (error) throw error;
}

// ============================================
// Session Reminder Functions
// ============================================

/**
 * Get reminders for a session
 */
export async function getSessionReminders(
  sessionId: string
): Promise<SessionReminder[]> {
  const { data, error } = await reminders()
    .select('*')
    .eq('session_id', sessionId)
    .order('reminder_time', { ascending: true });

  if (error) throw error;
  return (data || []) as SessionReminder[];
}

/**
 * Create reminders for a confirmed session
 */
export async function createSessionReminders(
  sessionId: string,
  userId: string,
  scheduledStart: string
): Promise<void> {
  const startTime = new Date(scheduledStart);

  // 24 hours before
  const reminder24h = new Date(startTime.getTime() - 24 * 60 * 60 * 1000);

  // 1 hour before
  const reminder1h = new Date(startTime.getTime() - 60 * 60 * 1000);

  const { error } = await reminders().insert([
    {
      session_id: sessionId,
      user_id: userId,
      reminder_type: '24_hours',
      reminder_time: reminder24h.toISOString(),
    },
    {
      session_id: sessionId,
      user_id: userId,
      reminder_type: '1_hour',
      reminder_time: reminder1h.toISOString(),
    },
  ]);

  if (error && error.code !== '23505') {
    // Ignore duplicate errors
    throw error;
  }
}

// ============================================
// Helper Functions
// ============================================

/**
 * Check if user can create a session with another user (must be collaborators)
 */
export async function canScheduleWith(
  hostId: string,
  _attendeeId: string,
  planId?: string
): Promise<boolean> {
  // Check if they are collaborators on any plan
  const { data, error } = await supabase
    .from('plan_collaborators')
    .select('id, plan_id')
    .eq('collaborator_id', hostId)
    .eq('status', 'accepted');

  if (error) return false;

  const collaborators = (data || []) as { id: string; plan_id: string }[];

  // If planId specified, verify it's for that plan
  if (planId && collaborators.length > 0) {
    const planMatch = collaborators.some((c) => c.plan_id === planId);
    if (!planMatch) return false;
  }

  return collaborators.length > 0;
}

/**
 * Get session statistics for a user
 */
export async function getSessionStats(userId: string): Promise<{
  total: number;
  completed: number;
  upcoming: number;
  cancelled: number;
}> {
  const { data, error } = await sessions()
    .select('status')
    .or(`host_id.eq.${userId},attendee_id.eq.${userId}`);

  if (error) throw error;

  const sessionList = (data || []) as { status: string }[];

  return {
    total: sessionList.length,
    completed: sessionList.filter((s) => s.status === 'completed').length,
    upcoming: sessionList.filter(
      (s) => s.status === 'proposed' || s.status === 'confirmed'
    ).length,
    cancelled: sessionList.filter((s) => s.status === 'cancelled').length,
  };
}
