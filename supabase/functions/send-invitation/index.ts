// Edge Function: send-invitation
// Sends mentor invitation email via Resend API
// Pattern: Auth with user token, write with service role

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface InvitationRequest {
  mentorEmail: string;
  personalMessage?: string;
}

// Helper to create JSON error response
function errorResponse(message: string, status: number, code?: string) {
  return new Response(
    JSON.stringify({ error: message, code }),
    {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status,
    }
  );
}

serve(async (req) => {
  console.log('=== send-invitation function started ===');

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  // Validate required environment variables
  const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
  const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY');
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
  const APP_URL = Deno.env.get('APP_URL') || 'https://careerplaybook.app';

  console.log('Environment check:', {
    SUPABASE_URL: !!SUPABASE_URL,
    SUPABASE_ANON_KEY: !!SUPABASE_ANON_KEY,
    SUPABASE_SERVICE_ROLE_KEY: !!SUPABASE_SERVICE_ROLE_KEY,
    RESEND_API_KEY: !!RESEND_API_KEY,
    APP_URL,
  });

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error('Missing required environment variables');
    return errorResponse('Server configuration error', 500, 'CONFIG_ERROR');
  }

  try {
    // 1. Auth the caller with user-token client
    console.log('Step 1: Checking authorization header');
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('No authorization header');
      return errorResponse('Missing authorization header', 401, 'UNAUTHORIZED');
    }
    console.log('Authorization header present');

    console.log('Step 2: Creating user client and verifying auth');

    // Extract the JWT token from the Authorization header
    const token = authHeader.replace('Bearer ', '');

    const supabaseUser = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: {
        headers: { Authorization: authHeader },
      },
    });

    // Pass the token directly to getUser for proper validation
    const { data: { user }, error: userError } = await supabaseUser.auth.getUser(token);

    if (userError || !user) {
      const authErrorMsg = userError?.message || 'Invalid or expired token';
      console.error('Auth error:', authErrorMsg);
      return errorResponse(authErrorMsg, 401, 'UNAUTHORIZED');
    }
    console.log('User authenticated:', user.id);

    // 2. Parse and validate request body
    console.log('Step 3: Parsing request body');
    let body: InvitationRequest;
    try {
      body = await req.json();
    } catch {
      console.error('Failed to parse request body');
      return errorResponse('Invalid request body', 400, 'INVALID_BODY');
    }

    const { mentorEmail, personalMessage } = body;
    console.log('Request body:', { mentorEmail, hasMessage: !!personalMessage });

    if (!mentorEmail || typeof mentorEmail !== 'string') {
      return errorResponse('Mentor email is required', 400, 'VALIDATION_ERROR');
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(mentorEmail)) {
      return errorResponse('Invalid email format', 400, 'VALIDATION_ERROR');
    }

    // 3. Get user profile (using user client - they can read their own profile)
    console.log('Step 4: Fetching user profile');
    const { data: profile, error: profileError } = await supabaseUser
      .from('profiles')
      .select('full_name, email')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      console.error('Profile error:', profileError?.message, profileError?.code);
      return errorResponse('User profile not found', 403, 'PROFILE_NOT_FOUND');
    }
    console.log('Profile found:', profile.full_name);

    // 4. Use service-role client for DB insert (bypasses RLS safely after auth)
    console.log('Step 5: Creating invitation in database');
    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { data: invitation, error: invitationError } = await supabaseAdmin
      .from('mentor_invitations')
      .insert({
        job_seeker_id: user.id,
        mentor_email: mentorEmail.toLowerCase().trim(),
        status: 'pending',
      })
      .select('id')
      .single();

    if (invitationError) {
      console.error('Invitation insert error:', invitationError.code, invitationError.message);

      // Handle unique constraint violation
      if (invitationError.code === '23505') {
        return errorResponse('Invitation already sent to this email', 409, 'DUPLICATE_INVITE');
      }

      // Handle table not found
      if (invitationError.code === '42P01') {
        console.error('Table mentor_invitations does not exist');
        return errorResponse('Database configuration error', 500, 'TABLE_NOT_FOUND');
      }

      return errorResponse('Failed to create invitation: ' + invitationError.message, 500, 'DB_ERROR');
    }
    console.log('Invitation created:', invitation.id);

    // 5. Send email via Resend
    if (RESEND_API_KEY) {
      const invitationLink = `${APP_URL}/accept-invitation?token=${invitation.id}`;
      const mentorName = mentorEmail.split('@')[0]; // Use email prefix as name placeholder
      const emailSubject = 'Invitation to Be a Career Mentor on Career Playbook';
      const emailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333; line-height: 1.6;">
          <h2 style="color: #4F46E5;">Invitation to Be a Career Mentor</h2>

          <p>Hello,</p>

          <p>You've been invited by <strong>${profile.full_name || 'Someone'}</strong> (${profile.email || 'a job seeker'}) to be a mentor in a career journey through Career Playbook.</p>

          <p><strong>Career Playbook</strong> is a structured career guidance platform that helps individuals gain clarity, set priorities, and stay focused through practical, time-bound planning.</p>

          ${personalMessage ? `<div style="background: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #4F46E5;">
            <p style="margin: 0; font-style: italic;">"${personalMessage}"</p>
          </div>` : ''}

          <p>As a mentor, you'll have <strong>read-only access</strong> to selected sections, allowing you to review progress and offer guidance without any administrative effort:</p>

          <ul style="margin: 15px 0;">
            <li><strong>Career Canvas:</strong> goals, strengths, and long-term aspirations</li>
            <li><strong>90-Day Plan:</strong> priorities, milestones, and progress tracking</li>
          </ul>

          <p><strong>What we expect from mentors:</strong><br/>
          Occasional review of progress and sharing thoughtful guidance or perspective when needed.</p>

          <div style="margin: 30px 0; text-align: center;">
            <a href="${invitationLink}" style="background: #4F46E5; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">Accept Invitation</a>
          </div>

          <p>Your experience and insight can make a meaningful difference, and we sincerely appreciate your support.</p>

          <p style="margin-top: 30px;">
            Warm regards,<br/>
            <strong>Team Career Playbook</strong><br/>
            <a href="https://www.careerplaybook.app" style="color: #4F46E5;">www.careerplaybook.app</a>
          </p>

          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" />
          <p style="color: #999; font-size: 12px;">This link will expire in 7 days. If you don't wish to be a mentor, you can safely ignore this email.</p>
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
            to: mentorEmail.toLowerCase().trim(),
            subject: emailSubject,
            html: emailHtml,
          }),
        });

        if (!resendResponse.ok) {
          const resendError = await resendResponse.text();
          console.error('Resend API error:', resendError);
          // Don't fail - invitation is created, email can be retried
        }
      } catch (emailError) {
        console.error('Email send error:', emailError);
        // Don't fail - invitation is created
      }
    } else {
      console.warn('RESEND_API_KEY not set - email not sent');
    }

    // 6. Return success
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
    console.error('Unexpected error:', error);
    return errorResponse(
      error instanceof Error ? error.message : 'Internal server error',
      500,
      'INTERNAL_ERROR'
    );
  }
});
