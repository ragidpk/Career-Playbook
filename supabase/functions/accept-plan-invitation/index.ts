// Edge Function: accept-plan-invitation
// Accepts a plan collaboration invitation using token validation

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AcceptRequest {
  token: string;
  planId: string;
}

// Hash the token for comparison (using SHA-256)
async function hashToken(token: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(token);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Get Supabase client with user's auth
    const authHeader = req.headers.get('Authorization')!;
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    // Service role client for updating invitation (bypasses RLS)
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Verify user is authenticated
    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser();

    if (userError || !user) {
      throw new Error('You must be logged in to accept an invitation');
    }

    // Parse request body
    const { token, planId }: AcceptRequest = await req.json();

    if (!token || !planId) {
      throw new Error('Missing required fields: token, planId');
    }

    // Hash the provided token for comparison
    const tokenHash = await hashToken(token);

    // Find the invitation by token hash and plan ID
    const { data: invitation, error: invitationError } = await supabaseAdmin
      .from('plan_collaborators')
      .select('*')
      .eq('invitation_token_hash', tokenHash)
      .eq('plan_id', planId)
      .single();

    if (invitationError || !invitation) {
      throw new Error('Invalid or expired invitation');
    }

    // Check if already processed
    if (invitation.status === 'accepted') {
      // Already accepted - check if it's the same user
      if (invitation.collaborator_id === user.id) {
        return new Response(
          JSON.stringify({
            success: true,
            message: 'Invitation already accepted',
            planId: invitation.plan_id,
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          }
        );
      }
      throw new Error('This invitation has already been accepted by another user');
    }

    if (invitation.status === 'declined') {
      throw new Error('This invitation has been declined');
    }

    // Verify the accepting user's email matches the invitation
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('email')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      throw new Error('User profile not found');
    }

    // Check email matches (case-insensitive)
    if (profile.email.toLowerCase() !== invitation.collaborator_email.toLowerCase()) {
      throw new Error(
        `This invitation was sent to ${invitation.collaborator_email}. Please log in with that email address.`
      );
    }

    // Check if invitation is expired (7 days)
    const createdAt = new Date(invitation.created_at);
    const now = new Date();
    const daysDiff = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24);

    if (daysDiff > 7) {
      throw new Error('This invitation has expired. Please ask for a new invitation.');
    }

    // Update the invitation to accepted
    const { error: updateError } = await supabaseAdmin
      .from('plan_collaborators')
      .update({
        status: 'accepted',
        collaborator_id: user.id,
        accepted_at: new Date().toISOString(),
      })
      .eq('id', invitation.id);

    if (updateError) {
      console.error('Update error:', updateError);
      throw new Error('Failed to accept invitation');
    }

    // Get plan details for response
    const { data: plan } = await supabaseAdmin
      .from('ninety_day_plans')
      .select('title')
      .eq('id', planId)
      .single();

    // Return success
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Invitation accepted successfully',
        planId: invitation.plan_id,
        planTitle: plan?.title || 'Career Plan',
        role: invitation.role,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error accepting invitation:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Internal server error',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
