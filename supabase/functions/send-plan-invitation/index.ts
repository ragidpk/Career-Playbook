// Edge Function: send-plan-invitation
// Sends plan collaboration invitation email via Resend API
// Uses hashed tokens for security

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
const APP_URL = Deno.env.get('APP_URL') || 'https://careerplaybook.app';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface InvitationRequest {
  planId: string;
  collaboratorEmail: string;
  role: 'mentor' | 'accountability_partner';
  personalMessage?: string;
  jobSeekerName: string;
  planTitle: string;
}

// Generate a secure random token
function generateToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, (b) => b.toString(16).padStart(2, '0')).join('');
}

// Hash the token for storage (using SHA-256)
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

    // Service role client for inserting invitation (bypasses RLS)
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Verify user is authenticated
    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser();

    if (userError) {
      console.error('Auth error:', userError);
      throw new Error(`Authentication failed: ${userError.message}`);
    }

    if (!user) {
      throw new Error('No authenticated user found. Please log in again.');
    }

    // Parse request body
    const {
      planId,
      collaboratorEmail,
      role,
      personalMessage,
      jobSeekerName,
      planTitle,
    }: InvitationRequest = await req.json();

    if (!planId || !collaboratorEmail || !role) {
      throw new Error('Missing required fields: planId, collaboratorEmail, role');
    }

    // Verify user owns this plan
    const { data: plan, error: planError } = await supabaseClient
      .from('ninety_day_plans')
      .select('id, user_id, title')
      .eq('id', planId)
      .single();

    if (planError || !plan) {
      throw new Error('Plan not found');
    }

    if (plan.user_id !== user.id) {
      throw new Error('Unauthorized: You do not own this plan');
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('full_name, email')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.error('Profile error:', profileError);
      throw new Error(`Profile lookup failed: ${profileError.message}`);
    }

    if (!profile) {
      throw new Error('Profile not found for user');
    }

    // Generate secure token and hash it
    const rawToken = generateToken();
    const tokenHash = await hashToken(rawToken);

    // Create invitation in database (use admin client to bypass RLS for insert)
    const { error: invitationError } = await supabaseAdmin
      .from('plan_collaborators')
      .insert({
        plan_id: planId,
        collaborator_email: collaboratorEmail.toLowerCase(),
        role: role,
        status: 'pending',
        personal_message: personalMessage,
        invitation_token_hash: tokenHash,
      })
      .select('id')
      .single();

    if (invitationError) {
      // Handle unique constraint violation
      if (invitationError.code === '23505') {
        throw new Error('Invitation already sent to this email for this plan');
      }
      console.error('Invitation error:', invitationError);
      throw new Error('Failed to create invitation');
    }

    // Prepare email content
    const roleLabel = role === 'mentor' ? 'mentor' : 'accountability partner';
    const invitationLink = `${APP_URL}/accept-plan-invitation?token=${rawToken}&plan=${planId}`;
    const emailSubject = `${jobSeekerName || profile.full_name} invited you to be their ${roleLabel}`;

    const emailHtml = `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #2563EB; margin: 0;">Career Playbook</h1>
        </div>

        <h2 style="color: #1f2937;">You've been invited to collaborate!</h2>

        <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
          <strong>${jobSeekerName || profile.full_name}</strong> (${profile.email}) has invited you to be their
          <strong>${roleLabel}</strong> for their career plan: <strong>"${planTitle || plan.title}"</strong>
        </p>

        ${personalMessage ? `
        <div style="background: #f3f4f6; padding: 20px; border-radius: 12px; margin: 24px 0; border-left: 4px solid #2563EB;">
          <p style="margin: 0 0 8px 0; font-weight: 600; color: #374151;">Personal message:</p>
          <p style="margin: 0; color: #4b5563; white-space: pre-wrap;">${personalMessage}</p>
        </div>` : ''}

        <div style="background: #eff6ff; padding: 20px; border-radius: 12px; margin: 24px 0;">
          <p style="margin: 0 0 12px 0; font-weight: 600; color: #1e40af;">As a ${roleLabel}, you'll be able to:</p>
          <ul style="margin: 0; padding-left: 20px; color: #3b82f6;">
            <li style="margin-bottom: 8px;">View their Career Canvas - goals, strengths, and aspirations</li>
            <li style="margin-bottom: 8px;">Track their 90-Day Plan progress and milestones</li>
            <li style="margin-bottom: 8px;">Leave comments and feedback on their plan</li>
            ${role === 'mentor' ? '<li>Approve their plan submissions</li>' : ''}
          </ul>
        </div>

        <div style="text-align: center; margin: 32px 0;">
          <a href="${invitationLink}"
             style="background: linear-gradient(135deg, #2563EB 0%, #1d4ed8 100%);
                    color: white;
                    padding: 14px 32px;
                    text-decoration: none;
                    border-radius: 10px;
                    display: inline-block;
                    font-weight: 600;
                    font-size: 16px;
                    box-shadow: 0 4px 14px rgba(37, 99, 235, 0.4);">
            Accept Invitation
          </a>
        </div>

        <p style="color: #9ca3af; font-size: 13px; text-align: center; margin-top: 32px;">
          This invitation link will expire in 7 days. If you don't want to collaborate, you can safely ignore this email.
        </p>

        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 32px 0;" />

        <p style="color: #9ca3af; font-size: 12px; text-align: center;">
          Sent from <a href="${APP_URL}" style="color: #2563EB;">Career Playbook</a>
        </p>
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
          from: 'Career Playbook <noreply@careerplaybook.app>',
          to: collaboratorEmail,
          subject: emailSubject,
          html: emailHtml,
        }),
      });

      if (!resendResponse.ok) {
        const resendError = await resendResponse.text();
        console.error('Resend API error:', resendError);
        // Don't throw - invitation is created, just log the error
      }
    } else {
      console.warn('RESEND_API_KEY not configured - email not sent');
    }

    // Return success without exposing token
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Invitation sent successfully',
        // Do NOT return the raw token to the client
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error sending plan invitation:', error);
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
