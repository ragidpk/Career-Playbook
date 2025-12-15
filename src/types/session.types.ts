// Session Scheduling Types

export type SessionType = 'one_time' | 'recurring';
export type SessionStatus = 'proposed' | 'confirmed' | 'cancelled' | 'completed' | 'no_show';
export type RecurrenceRule = 'weekly' | 'biweekly';
export type MeetingProvider = 'google_meet' | 'zoom' | 'manual';
export type ReminderType = '24_hours' | '1_hour' | 'custom';
export type CalendarProvider = 'google' | 'microsoft' | 'apple';

export interface ProposedTime {
  start: string; // ISO datetime
  end: string;   // ISO datetime
}

export interface SessionOutcome {
  id: string;
  text: string;
  completed: boolean;
}

export interface MentorshipSession {
  id: string;
  plan_id: string | null;
  host_id: string;
  attendee_id: string;

  // Session details
  title: string;
  description: string | null;
  session_type: SessionType;
  status: SessionStatus;

  // Scheduling
  proposed_times: ProposedTime[] | null;
  scheduled_start: string | null;
  scheduled_end: string | null;
  duration_minutes: number;
  timezone: string;

  // Recurrence
  recurrence_rule: RecurrenceRule | null;
  recurrence_end_date: string | null;
  parent_session_id: string | null;

  // Video conferencing
  meeting_provider: MeetingProvider | null;
  meeting_link: string | null;
  meeting_id: string | null;

  // Session tracking
  actual_duration_minutes: number | null;
  session_notes: string | null;
  outcomes: SessionOutcome[] | null;

  // Timestamps
  created_at: string;
  updated_at: string;
  confirmed_at: string | null;
  completed_at: string | null;
  cancelled_at: string | null;
  cancellation_reason: string | null;

  // Joined data (optional)
  host?: {
    id: string;
    full_name: string | null;
    email: string | null;
  };
  attendee?: {
    id: string;
    full_name: string | null;
    email: string | null;
  };
  plan?: {
    id: string;
    title: string;
  };
}

export interface CalendarConnection {
  id: string;
  user_id: string;
  provider: CalendarProvider;
  access_token: string | null;
  refresh_token: string | null;
  token_expires_at: string | null;
  calendar_id: string | null;
  calendar_email: string | null;
  is_active: boolean;
  last_sync_at: string | null;
  sync_error: string | null;
  created_at: string;
  updated_at: string;
}

export interface SessionReminder {
  id: string;
  session_id: string;
  user_id: string;
  reminder_type: ReminderType;
  reminder_time: string;
  email_sent: boolean;
  email_sent_at: string | null;
  in_app_sent: boolean;
  in_app_sent_at: string | null;
  created_at: string;
}

// Input types for creating/updating sessions
export interface CreateSessionInput {
  plan_id?: string;
  attendee_id: string;
  title: string;
  description?: string;
  session_type: SessionType;
  proposed_times: ProposedTime[];
  duration_minutes: number;
  timezone: string;
  recurrence_rule?: RecurrenceRule;
  recurrence_end_date?: string;
  meeting_provider?: MeetingProvider;
  meeting_link?: string;
}

export interface ConfirmSessionInput {
  session_id: string;
  selected_time: ProposedTime;
}

export interface CompleteSessionInput {
  session_id: string;
  session_notes?: string;
  outcomes?: SessionOutcome[];
  actual_duration_minutes?: number;
}

export interface CancelSessionInput {
  session_id: string;
  reason?: string;
}

// Filter types
export interface SessionFilters {
  status?: SessionStatus[];
  from_date?: string;
  to_date?: string;
  as_host?: boolean;
  as_attendee?: boolean;
  plan_id?: string;
}

// Session with profile info for display
export interface SessionWithProfiles extends MentorshipSession {
  host: {
    id: string;
    full_name: string | null;
    email: string | null;
  };
  attendee: {
    id: string;
    full_name: string | null;
    email: string | null;
  };
}
