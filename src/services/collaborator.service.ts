// Collaborator Service
// Handles plan collaborators (mentors and accountability partners)

import { supabase } from './supabase';

export type CollaboratorRole = 'mentor' | 'accountability_partner';

export interface PlanCollaborator {
  id: string;
  plan_id: string;
  collaborator_email: string;
  collaborator_id: string | null;
  role: CollaboratorRole;
  status: 'pending' | 'accepted' | 'declined';
  personal_message: string | null;
  invitation_token_hash: string; // Note: This is a hash, not the raw token
  created_at: string;
  accepted_at: string | null;
  collaborator_name?: string | null;
}

export interface InviteCollaboratorInput {
  planId: string;
  email: string;
  role: CollaboratorRole;
  personalMessage?: string;
  jobSeekerName: string;
  planTitle: string;
}

/**
 * Invite a collaborator to a plan
 */
export async function inviteCollaborator(input: InviteCollaboratorInput) {
  // Get current session to ensure auth header is included
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    throw new Error('You must be logged in to invite collaborators');
  }

  const { data, error } = await supabase.functions.invoke('send-plan-invitation', {
    body: {
      planId: input.planId,
      collaboratorEmail: input.email,
      role: input.role,
      personalMessage: input.personalMessage,
      jobSeekerName: input.jobSeekerName,
      planTitle: input.planTitle,
    },
    headers: {
      Authorization: `Bearer ${session.access_token}`,
    },
  });

  // Check for error in response body first (edge function returns error in JSON)
  if (data?.error) {
    throw new Error(data.error);
  }

  if (error) {
    // Try to extract error message from FunctionsHttpError
    const functionsError = error as any;
    if (functionsError.context) {
      try {
        const errorBody = await functionsError.context.json();
        if (errorBody?.error) {
          throw new Error(errorBody.error);
        }
      } catch {
        // Fall through to default error
      }
    }
    throw new Error(error.message || 'Failed to send invitation');
  }

  return data;
}

/**
 * Get all collaborators for a plan
 */
export async function getPlanCollaborators(planId: string): Promise<PlanCollaborator[]> {
  const { data, error } = await supabase
    .from('plan_collaborators')
    .select('*')
    .eq('plan_id', planId)
    .order('created_at', { ascending: false });

  if (error) {
    // Table might not exist yet - return empty array
    if (error.code === '42P01') return [];
    throw error;
  }
  return data || [];
}

/**
 * Get plan collaborators with profile info
 */
export async function getPlanCollaboratorsWithProfiles(planId: string): Promise<PlanCollaborator[]> {
  // First get the collaborators
  const { data, error } = await supabase
    .from('plan_collaborators')
    .select('*')
    .eq('plan_id', planId)
    .order('created_at', { ascending: false });

  if (error) {
    if (error.code === '42P01') return [];
    throw error;
  }

  if (!data || data.length === 0) return [];

  // Get profile info for collaborators who have accepted (have collaborator_id)
  // Use profiles_public for safe access to display names
  const collaboratorIds = [...new Set(
    data
      .filter((c: any) => c.collaborator_id)
      .map((c: any) => c.collaborator_id)
  )];

  const profileMap: Record<string, string> = {};

  if (collaboratorIds.length > 0) {
    const { data: profiles, error: profileError } = await supabase
      .from('profiles_public')
      .select('id, full_name')
      .in('id', collaboratorIds);

    if (profileError) {
      console.error('Error fetching profiles:', profileError);
    }

    (profiles || []).forEach((p: any) => {
      profileMap[p.id] = p.full_name;
    });
  }

  return data.map((item: any) => ({
    ...item,
    collaborator_name: item.collaborator_id ? profileMap[item.collaborator_id] || null : null,
  }));
}

/**
 * Remove a collaborator from a plan
 */
export async function removeCollaborator(collaboratorId: string): Promise<void> {
  const { error } = await supabase
    .from('plan_collaborators')
    .delete()
    .eq('id', collaboratorId);

  if (error) throw error;
}

/**
 * Accept a plan collaboration invitation
 */
export async function acceptPlanInvitation(token: string, planId: string): Promise<{
  success: boolean;
  message: string;
  planId: string;
  planTitle: string;
  role: string;
}> {
  const { data, error } = await supabase.functions.invoke('accept-plan-invitation', {
    body: { token, planId },
  });

  if (error) throw error;
  if (data.error) throw new Error(data.error);
  return data;
}

/**
 * Get plan comments
 */
export async function getPlanComments(planId: string) {
  const { data, error } = await supabase
    .from('plan_comments')
    .select(`
      *,
      profiles:user_id (
        full_name,
        email
      )
    `)
    .eq('plan_id', planId)
    .order('created_at', { ascending: true });

  if (error) {
    if (error.code === '42P01') return [];
    throw error;
  }
  return data || [];
}

/**
 * Add a comment to a plan
 */
export async function addPlanComment(planId: string, content: string) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('plan_comments')
    // @ts-expect-error - Table may not exist yet
    .insert({
      plan_id: planId,
      user_id: user.id,
      content,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Update plan submission status
 */
export async function updatePlanSubmissionStatus(
  planId: string,
  status: 'draft' | 'submitted' | 'under_review' | 'approved'
) {
  const { error } = await supabase
    .from('ninety_day_plans')
    // @ts-expect-error - Supabase types need regeneration
    .update({ submission_status: status })
    .eq('id', planId);

  if (error) throw error;
}

/**
 * Generate share link for a plan
 */
export function generateShareLink(planId: string, token: string): string {
  const baseUrl = window.location.origin;
  return `${baseUrl}/accept-plan-invitation?token=${token}&plan=${planId}`;
}
