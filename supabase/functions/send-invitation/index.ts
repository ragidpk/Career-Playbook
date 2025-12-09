// Edge Function: send-invitation
// Sends mentor invitation email via Resend API

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
const APP_URL = Deno.env.get('APP_URL') || 'http://localhost:5173';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface InvitationRequest {
  mentorEmail: string;
  personalMessage?: string;
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

    // Verify user is authenticated
    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser();

    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    // Parse request body
    const { mentorEmail, personalMessage }: InvitationRequest = await req.json();

    if (!mentorEmail) {
      throw new Error('Mentor email is required');
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('full_name, email')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      throw new Error('Profile not found');
    }

    // Create invitation in database
    const { data: invitation, error: invitationError } = await supabaseClient
      .from('mentor_invitations')
      .insert({
        job_seeker_id: user.id,
        mentor_email: mentorEmail.toLowerCase(),
        status: 'pending',
      })
      .select()
      .single();

    if (invitationError) {
      // Handle unique constraint violation
      if (invitationError.code === '23505') {
        throw new Error('Invitation already sent to this email');
      }
      throw invitationError;
    }

    // Prepare email content
    const invitationLink = `${APP_URL}/accept-invitation?token=${invitation.id}`;
    const emailSubject = `${profile.full_name} invited you to be their career mentor`;
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>You've been invited to be a career mentor!</h2>
        <p><strong>${profile.full_name}</strong> (${profile.email}) has invited you to mentor them on their career journey using Career Playbook.</p>

        ${personalMessage ? `<div style="background: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0;"><strong>Personal message:</strong></p>
          <p style="margin: 10px 0 0 0;">${personalMessage}</p>
        </div>` : ''}

        <p>As a mentor, you'll have read-only access to:</p>
        <ul>
          <li>Their Career Canvas - goals, strengths, and aspirations</li>
          <li>Their 90-Day Plan - milestones and progress tracking</li>
        </ul>

        <div style="margin: 30px 0;">
          <a href="${invitationLink}" style="background: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Accept Invitation</a>
        </div>

        <p style="color: #666; font-size: 14px;">This link will expire in 7 days. If you don't want to be a mentor, you can safely ignore this email.</p>
      </div>
    `;

    // Send email via Resend
    if (RESEND_API_KEY) {
      const resendResponse = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: 'Career Playbook <noreply@careerplaybook.com>',
          to: mentorEmail,
          subject: emailSubject,
          html: emailHtml,
        }),
      });

      if (!resendResponse.ok) {
        const resendError = await resendResponse.text();
        console.error('Resend API error:', resendError);
        // Don't throw - invitation is created, just log the error
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        invitationId: invitation.id,
        message: 'Invitation sent successfully',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error sending invitation:', error);
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
