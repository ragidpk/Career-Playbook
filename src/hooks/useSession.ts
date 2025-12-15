// Session Hooks
// React Query hooks for session management

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getSessions,
  getSessionById,
  getUpcomingSessions,
  getPastSessions,
  createSession,
  confirmSession,
  cancelSession,
  completeSession,
  updateSessionNotes,
  markSessionNoShow,
  deleteSession,
  getCalendarConnections,
  disconnectCalendar,
  getSessionStats,
  createSessionReminders,
} from '../services/session.service';
import type {
  SessionFilters,
  CreateSessionInput,
  ConfirmSessionInput,
  CompleteSessionInput,
  CancelSessionInput,
  SessionWithProfiles,
} from '../types/session.types';

// Query Keys
const sessionKeys = {
  all: ['sessions'] as const,
  lists: () => [...sessionKeys.all, 'list'] as const,
  list: (userId: string, filters?: SessionFilters) =>
    [...sessionKeys.lists(), userId, filters] as const,
  upcoming: (userId: string) => [...sessionKeys.all, 'upcoming', userId] as const,
  past: (userId: string) => [...sessionKeys.all, 'past', userId] as const,
  detail: (id: string) => [...sessionKeys.all, 'detail', id] as const,
  stats: (userId: string) => [...sessionKeys.all, 'stats', userId] as const,
};

const calendarKeys = {
  all: ['calendar'] as const,
  connections: (userId: string) => [...calendarKeys.all, 'connections', userId] as const,
};

/**
 * Hook to get all sessions for a user
 */
export function useSessions(userId: string | undefined, filters?: SessionFilters) {
  return useQuery({
    queryKey: sessionKeys.list(userId || '', filters),
    queryFn: () => getSessions(userId!, filters),
    enabled: !!userId,
    staleTime: 1000 * 60, // 1 minute
  });
}

/**
 * Hook to get a single session by ID
 */
export function useSession(sessionId: string | undefined) {
  return useQuery({
    queryKey: sessionKeys.detail(sessionId || ''),
    queryFn: () => getSessionById(sessionId!),
    enabled: !!sessionId,
  });
}

/**
 * Hook to get upcoming sessions
 */
export function useUpcomingSessions(userId: string | undefined, limit?: number) {
  return useQuery({
    queryKey: sessionKeys.upcoming(userId || ''),
    queryFn: () => getUpcomingSessions(userId!, limit),
    enabled: !!userId,
    staleTime: 1000 * 60, // 1 minute
  });
}

/**
 * Hook to get past sessions
 */
export function usePastSessions(userId: string | undefined, limit?: number) {
  return useQuery({
    queryKey: sessionKeys.past(userId || ''),
    queryFn: () => getPastSessions(userId!, limit),
    enabled: !!userId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * Hook to get session statistics
 */
export function useSessionStats(userId: string | undefined) {
  return useQuery({
    queryKey: sessionKeys.stats(userId || ''),
    queryFn: () => getSessionStats(userId!),
    enabled: !!userId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * Hook to create a new session
 * @param hostId - The authenticated user's ID. Must be a valid UUID, not empty string.
 */
export function useCreateSession(hostId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateSessionInput) => {
      // Guard against empty/undefined hostId - this should be caught before calling
      if (!hostId) {
        return Promise.reject(new Error('Cannot create session: host ID is required'));
      }
      return createSession(hostId, input);
    },
    onSuccess: () => {
      // Invalidate all session queries
      queryClient.invalidateQueries({ queryKey: sessionKeys.all });
    },
  });
}

/**
 * Hook to confirm a session (select a proposed time)
 */
export function useConfirmSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: ConfirmSessionInput) => {
      const session = await confirmSession(input);

      // Create reminders for both host and attendee
      try {
        if (session.scheduled_start) {
          await createSessionReminders(
            session.id,
            session.host_id,
            session.scheduled_start
          );
          await createSessionReminders(
            session.id,
            session.attendee_id,
            session.scheduled_start
          );
        }
      } catch (e) {
        console.warn('Failed to create reminders:', e);
      }

      return session;
    },
    onSuccess: (session) => {
      queryClient.invalidateQueries({ queryKey: sessionKeys.all });
      queryClient.setQueryData(sessionKeys.detail(session.id), session);
    },
  });
}

/**
 * Hook to cancel a session
 */
export function useCancelSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CancelSessionInput) => cancelSession(input),
    onSuccess: (session) => {
      queryClient.invalidateQueries({ queryKey: sessionKeys.all });
      queryClient.setQueryData(sessionKeys.detail(session.id), session);
    },
  });
}

/**
 * Hook to complete a session
 */
export function useCompleteSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CompleteSessionInput) => completeSession(input),
    onSuccess: (session) => {
      queryClient.invalidateQueries({ queryKey: sessionKeys.all });
      queryClient.setQueryData(sessionKeys.detail(session.id), session);
    },
  });
}

/**
 * Hook to update session notes
 */
export function useUpdateSessionNotes() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ sessionId, notes }: { sessionId: string; notes: string }) =>
      updateSessionNotes(sessionId, notes),
    onSuccess: (session) => {
      queryClient.setQueryData(sessionKeys.detail(session.id), session);
    },
  });
}

/**
 * Hook to mark session as no-show
 */
export function useMarkNoShow() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (sessionId: string) => markSessionNoShow(sessionId),
    onSuccess: (session) => {
      queryClient.invalidateQueries({ queryKey: sessionKeys.all });
      queryClient.setQueryData(sessionKeys.detail(session.id), session);
    },
  });
}

/**
 * Hook to delete a session
 */
export function useDeleteSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (sessionId: string) => deleteSession(sessionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sessionKeys.all });
    },
  });
}

// ============================================
// Calendar Hooks
// ============================================

/**
 * Hook to get calendar connections
 */
export function useCalendarConnections(userId: string | undefined) {
  return useQuery({
    queryKey: calendarKeys.connections(userId || ''),
    queryFn: () => getCalendarConnections(userId!),
    enabled: !!userId,
  });
}

/**
 * Hook to disconnect a calendar
 */
export function useDisconnectCalendar() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (connectionId: string) => disconnectCalendar(connectionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: calendarKeys.all });
    },
  });
}

// ============================================
// Helper Hooks
// ============================================

/**
 * Hook to check if a session is upcoming (within 24 hours)
 */
export function useIsSessionUpcoming(session: SessionWithProfiles | null) {
  if (!session?.scheduled_start) return false;

  const now = new Date();
  const sessionStart = new Date(session.scheduled_start);
  const diffMs = sessionStart.getTime() - now.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);

  return diffHours > 0 && diffHours <= 24;
}

/**
 * Hook to get time until session
 */
export function useTimeUntilSession(scheduledStart: string | null) {
  if (!scheduledStart) return null;

  const now = new Date();
  const sessionStart = new Date(scheduledStart);
  const diffMs = sessionStart.getTime() - now.getTime();

  if (diffMs < 0) return 'Past';

  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffDays > 0) return `${diffDays}d`;
  if (diffHours > 0) return `${diffHours}h`;
  if (diffMinutes > 0) return `${diffMinutes}m`;
  return 'Now';
}
