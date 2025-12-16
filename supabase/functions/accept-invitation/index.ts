// Edge Function: accept-invitation
// Accepts mentor invitation, creates mentor access record, and notifies job seeker

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
const APP_URL = Deno.env.get('APP_URL') || 'https://careerplaybook.app';

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

    // Get mentor's profile (current user)
    const { data: mentorProfile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('email, full_name')
      .eq('id', user.id)
      .single();

    if (profileError) {
      throw new Error(`Profile error: ${profileError.message}`);
    }
    if (!mentorProfile) {
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
    if (invitation.mentor_email.toLowerCase() !== mentorProfile.email.toLowerCase()) {
      throw new Error(`Email mismatch: invitation sent to ${invitation.mentor_email}, but you are logged in as ${mentorProfile.email}`);
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

    // Step 3: Get job seeker's profile to send notification email
    const { data: jobSeekerProfile } = await supabaseAdmin
      .from('profiles')
      .select('email, full_name')
      .eq('id', invitation.job_seeker_id)
      .single();

    // Step 4: Send notification email to job seeker
    if (RESEND_API_KEY && jobSeekerProfile?.email) {
      const mentorName = mentorProfile.full_name || mentorProfile.email;
      const jobSeekerName = jobSeekerProfile.full_name || 'there';
      const scheduleLink = `${APP_URL}/sessions?schedule=true&mentorId=${user.id}`;

      const emailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333; line-height: 1.6;">
          <h2 style="color: #10B981;">Great News! Your Mentor Invitation Was Accepted</h2>

          <p>Hello ${jobSeekerName},</p>

          <p><strong>${mentorName}</strong> has accepted your invitation to be your career mentor on Career Playbook!</p>

          <p>Your mentor now has read-only access to your:</p>
          <ul style="margin: 15px 0;">
            <li><strong>Career Canvas</strong> - Your goals, strengths, and aspirations</li>
            <li><strong>90-Day Plan</strong> - Your priorities and milestones</li>
          </ul>

          <div style="background: #f0fdf4; padding: 20px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #10B981;">
            <p style="margin: 0 0 15px 0; font-weight: bold;">Ready to connect?</p>
            <p style="margin: 0;">Schedule your first mentorship session to discuss your career goals and get valuable guidance.</p>
          </div>

          <div style="margin: 30px 0; text-align: center;">
            <a href="${scheduleLink}" style="background: #4F46E5; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">Schedule a Session</a>
          </div>

          <p>We recommend scheduling an introductory session within the next few days to make the most of your mentorship.</p>

          <p style="margin-top: 30px;">
            Best of luck on your career journey!<br/>
            <strong>Team Career Playbook</strong><br/>
            <a href="https://www.careerplaybook.app" style="color: #4F46E5;">www.careerplaybook.app</a>
          </p>
        </div>
      `;

      try {
        const resendResponse = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${RESEND_API_KEY}`,
          },
          body: JSON.stringify({
            from: 'Career Playbook <noreply@careerplaybook.app>',
            to: jobSeekerProfile.email,
            subject: `${mentorName} accepted your mentor invitation!`,
            html: emailHtml,
          }),
        });

        if (!resendResponse.ok) {
          const resendError = await resendResponse.text();
          console.error('Resend API error:', resendError);
          // Don't fail - the invitation was accepted successfully
        } else {
          console.log('Notification email sent to job seeker');
        }
      } catch (emailError) {
        console.error('Email send error:', emailError);
        // Don't fail - the invitation was accepted successfully
      }
    } else {
      console.warn('RESEND_API_KEY not set or job seeker email not found - notification not sent');
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
