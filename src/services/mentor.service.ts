// Mentor Service
// Handles mentor invitation and access management

import { supabase } from './supabase';

export interface MentorInvitation {
  id: string;
  job_seeker_id: string;
  mentor_email: string;
  mentor_id: string | null;
  status: 'pending' | 'accepted' | 'declined';
  invited_at: string;
  accepted_at: string | null;
}

export interface MentorAccess {
  id: string;
  job_seeker_id: string;
  mentor_id: string;
  permission_level: 'view' | 'comment' | 'edit';
  created_at: string;
}

export interface Mentee {
  job_seeker_id: string;
  profiles: {
    id: string;
    email: string;
    full_name: string | null;
  };
}

/**
 * Invite a mentor via email
 * @param mentorEmail - Email address of the mentor to invite
 * @param personalMessage - Optional personal message to include in the invitation
 * @returns Invitation ID and status
 */
export async function inviteMentor(mentorEmail: string, personalMessage?: string) {
  const { data, error } = await supabase.functions.invoke('send-invitation', {
    body: { mentorEmail, personalMessage },
  });

  // When edge function returns non-2xx, Supabase sets both error AND data
  // data contains the JSON response body with our error message
  if (data?.error) {
    throw new Error(data.error);
  }

  if (error) {
    // Try to extract error from FunctionsHttpError context
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const functionsError = error as any;

    // Check if context exists and try to read the response body
    if (functionsError.context?.body) {
      try {
        const reader = functionsError.context.body.getReader();
        const { value } = await reader.read();
        const text = new TextDecoder().decode(value);
        const errorBody = JSON.parse(text);
        if (errorBody?.error) {
          throw new Error(errorBody.error);
        }
      } catch {
        // Parsing failed, continue to default error
      }
    }

    throw new Error(error.message || 'Failed to send invitation');
  }

  return data;
}

/**
 * Get all invitations for a user (job seeker)
 * @param userId - The job seeker's user ID
 * @returns Array of mentor invitations
 */
export async function getInvitations(userId: string): Promise<MentorInvitation[]> {
  const { data, error } = await supabase
    .from('mentor_invitations')
    .select('*')
    .eq('job_seeker_id', userId)
    .order('invited_at', { ascending: false });

  if (error) {
    console.error('Supabase error loading invitations:', error.code, error.message, error.details);
    throw new Error(`${error.message} (${error.code})`);
  }
  return data || [];
}

/**
 * Accept a mentor invitation
 * @param invitationId - The invitation ID to accept
 * @returns Success status and job seeker ID
 */
export async function acceptInvitation(invitationId: string) {
  const { data, error } = await supabase.functions.invoke('accept-invitation', {
    body: { invitationId },
  });

  // Check data.error first (Edge Function returns error in body with 400 status)
  if (data?.error) {
    throw new Error(data.error);
  }

  if (error) {
    // FunctionsHttpError contains response context - try to extract actual error
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const functionsError = error as any;

    // Try multiple ways to extract the error message
    if (functionsError.context) {
      try {
        // Try to get JSON from response
        const errorBody = await functionsError.context.json();
        if (errorBody?.error) {
          throw new Error(errorBody.error);
        }
      } catch {
        // JSON parsing failed, try text
        try {
          const text = await functionsError.context.text();
          if (text) {
            const parsed = JSON.parse(text);
            if (parsed?.error) {
              throw new Error(parsed.error);
            }
          }
        } catch {
          // Fall through to default error
        }
      }
    }

    throw new Error(error.message || 'Failed to accept invitation');
  }

  return data;
}

/**
 * Decline a mentor invitation
 * @param invitationId - The invitation ID to decline
 */
export async function declineInvitation(invitationId: string) {
  const { error } = await supabase
    .from('mentor_invitations')
    // @ts-expect-error - Supabase types need regeneration
    .update({ status: 'declined' })
    .eq('id', invitationId);

  if (error) throw error;
}

/**
 * Resend a mentor invitation
 * @param invitationId - The invitation ID to resend
 */
export async function resendInvitation(invitationId: string) {
  // Get the invitation details
  const { data: invitation, error: fetchError } = await supabase
    .from('mentor_invitations')
    .select('mentor_email')
    .eq('id', invitationId)
    .single();

  if (fetchError) throw fetchError;
  if (!invitation) throw new Error('Invitation not found');

  // Delete the old invitation
  const { error: deleteError } = await supabase
    .from('mentor_invitations')
    .delete()
    .eq('id', invitationId);

  if (deleteError) throw deleteError;

  // Send a new invitation
  return inviteMentor((invitation as any).mentor_email);
}

/**
 * Get all mentees for a mentor
 * @param mentorId - The mentor's user ID
 * @returns Array of mentees with profile information
 */
export async function getMentees(mentorId: string): Promise<Mentee[]> {
  const { data, error } = await supabase
    .from('mentor_access')
    .select(`
      job_seeker_id,
      profiles!mentor_access_job_seeker_id_fkey (
        id,
        email,
        full_name
      )
    `)
    .eq('mentor_id', mentorId);

  if (error) throw error;
  return data || [];
}

/**
 * Revoke mentor access
 * @param jobSeekerId - The job seeker's user ID
 * @param mentorId - The mentor's user ID
 */
export async function revokeAccess(jobSeekerId: string, mentorId: string) {
  const { error } = await supabase
    .from('mentor_access')
    .delete()
    .eq('job_seeker_id', jobSeekerId)
    .eq('mentor_id', mentorId);

  if (error) throw error;
}

/**
 * Get mentor access record for current user and a specific job seeker
 * @param jobSeekerId - The job seeker's user ID
 * @returns Mentor access record or null
 */
export async function getMentorAccess(jobSeekerId: string): Promise<MentorAccess | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('mentor_access')
    .select('*')
    .eq('mentor_id', user.id)
    .eq('job_seeker_id', jobSeekerId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; // Not found
    throw error;
  }
  return data;
}

/**
 * Check if current user is a mentor viewing someone else's data
 * @returns True if user is a mentor with active access
 */
export async function isMentorView(): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { data, error } = await supabase
    .from('mentor_access')
    .select('id')
    .eq('mentor_id', user.id)
    .limit(1);

  if (error) return false;
  return (data?.length || 0) > 0;
}
