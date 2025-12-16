// Edge Function: accept-invitation
// Accepts mentor invitation and creates mentor access record with transaction safety

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AcceptInvitationRequest {
  invitationId: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Get and validate auth header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Missing or invalid authorization header' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }

    // Extract the JWT token
    const token = authHeader.replace('Bearer ', '');

    // Get Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    // Verify user is authenticated by passing token directly
    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser(token);

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized: Invalid or expired token' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }

    // Parse request body
    const { invitationId }: AcceptInvitationRequest = await req.json();

    if (!invitationId) {
      throw new Error('Invitation ID is required');
    }

    // Use service role for queries to bypass RLS (we verify permissions manually)
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get user's email from profile
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('email')
      .eq('id', user.id)
      .single();

    if (profileError) {
      throw new Error(`Profile error: ${profileError.message}`);
    }
    if (!profile) {
      throw new Error(`No profile found for user ${user.id}`);
    }

    // Get invitation
    const { data: invitation, error: invitationError } = await supabaseAdmin
      .from('mentor_invitations')
      .select('id, job_seeker_id, mentor_email, status')
      .eq('id', invitationId)
      .single();

    if (invitationError) {
      throw new Error(`Invitation error: ${invitationError.message}`);
    }
    if (!invitation) {
      throw new Error(`No invitation found with ID ${invitationId}`);
    }

    // Verify email matches (case-insensitive) - SECURITY CHECK
    if (invitation.mentor_email.toLowerCase() !== profile.email.toLowerCase()) {
      throw new Error(`Email mismatch: invitation sent to ${invitation.mentor_email}, but you are logged in as ${profile.email}`);
    }

    // Check if already accepted
    if (invitation.status === 'accepted') {
      throw new Error('This invitation has already been accepted');
    }

    // Check if declined
    if (invitation.status === 'declined') {
      throw new Error('This invitation has been declined');
    }

    // CRITICAL: Transaction safety - Update invitation status and create access record
    // Step 1: Update invitation status
    const { error: updateError } = await supabaseAdmin
      .from('mentor_invitations')
      .update({
        status: 'accepted',
        mentor_id: user.id,
        accepted_at: new Date().toISOString(),
      })
      .eq('id', invitationId);

    if (updateError) {
      throw new Error(`Failed to update invitation: ${updateError.message}`);
    }

    // Step 2: Create mentor access record
    const { error: accessError } = await supabaseAdmin
      .from('mentor_access')
      .insert({
        job_seeker_id: invitation.job_seeker_id,
        mentor_id: user.id,
        permission_level: 'view',
      });

    if (accessError) {
      // If access creation fails, rollback invitation status
      await supabaseAdmin
        .from('mentor_invitations')
        .update({
          status: 'pending',
          mentor_id: null,
          accepted_at: null,
        })
        .eq('id', invitationId);

      // Handle duplicate access error
      if (accessError.code === '23505') {
        throw new Error('You already have access to this mentee');
      }
      throw new Error(`Failed to create mentor access: ${accessError.message}`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Invitation accepted successfully',
        jobSeekerId: invitation.job_seeker_id,
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
