// Edge Function: send-session-reminder
// Sends automated session reminders (24hr and 1hr before scheduled sessions)
// Called by pg_cron or scheduled job

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
const APP_URL = Deno.env.get('APP_URL') || 'https://careerplaybook.app';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SessionReminder {
  id: string;
  session_id: string;
  user_id: string;
  reminder_type: '24_hours' | '1_hour';
  reminder_time: string;
  email_sent: boolean;
  in_app_sent: boolean;
}

interface Session {
  id: string;
  title: string;
  scheduled_start: string;
  scheduled_end: string;
  timezone: string;
  meeting_link: string | null;
  host: { id: string; full_name: string; email: string };
  attendee: { id: string; full_name: string; email: string };
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Service role client for accessing data
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const now = new Date();

    // Get all pending reminders that are due (reminder_time <= now)
    const { data: reminders, error: reminderError } = await supabaseAdmin
      .from('session_reminders')
      .select('*')
      .eq('email_sent', false)
      .lte('reminder_time', now.toISOString())
      .order('reminder_time', { ascending: true })
      .limit(50);

    if (reminderError) {
      console.error('Error fetching reminders:', reminderError);
      throw new Error('Failed to fetch reminders');
    }

    if (!reminders || reminders.length === 0) {
      return new Response(
        JSON.stringify({ success: true, processed: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    let processed = 0;
    let errors = 0;

    for (const reminder of reminders as SessionReminder[]) {
      try {
        // Get session details with profiles
        const { data: session, error: sessionError } = await supabaseAdmin
          .from('mentorship_sessions')
          .select(`
            id,
            title,
            scheduled_start,
            scheduled_end,
            timezone,
            meeting_link,
            host:host_id(id, full_name, email),
            attendee:attendee_id(id, full_name, email)
          `)
          .eq('id', reminder.session_id)
          .single();

        if (sessionError || !session) {
          console.error(`Session ${reminder.session_id} not found`);
          continue;
        }

        // Get the user to send reminder to
        const { data: user, error: userError } = await supabaseAdmin
          .from('profiles')
          .select('id, full_name, email')
          .eq('id', reminder.user_id)
          .single();

        if (userError || !user) {
          console.error(`User ${reminder.user_id} not found`);
          continue;
        }

        // Determine the other person
        const isHost = user.id === (session.host as any).id;
        const otherPerson = isHost ? (session.attendee as any) : (session.host as any);

        // Format session time using session's stored timezone
        const sessionTimezone = session.timezone || 'UTC';
        const sessionDate = new Date(session.scheduled_start);
        const formattedDate = sessionDate.toLocaleDateString('en-US', {
          weekday: 'long',
          month: 'long',
          day: 'numeric',
          year: 'numeric',
          timeZone: sessionTimezone,
        });
        const formattedTime = sessionDate.toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
          timeZone: sessionTimezone,
        });
        // Include timezone abbreviation for clarity
        const tzAbbr = new Intl.DateTimeFormat('en-US', {
          timeZone: sessionTimezone,
          timeZoneName: 'short',
        }).formatToParts(sessionDate).find(p => p.type === 'timeZoneName')?.value || sessionTimezone;

        // Reminder type message
        const timeUntil = reminder.reminder_type === '24_hours' ? 'tomorrow' : 'in 1 hour';

        // Build email content
        const emailSubject = `Reminder: "${session.title}" ${timeUntil}`;
        const emailHtml = `
          <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #2563EB; margin: 0;">Career Playbook</h1>
            </div>

            <h2 style="color: #1f2937;">Session Reminder</h2>

            <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
              Hi ${user.full_name || 'there'},
            </p>

            <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
              This is a friendly reminder that you have a session ${timeUntil}:
            </p>

            <div style="background: #f3f4f6; padding: 24px; border-radius: 12px; margin: 24px 0;">
              <h3 style="margin: 0 0 16px 0; color: #1f2937;">${session.title}</h3>

              <p style="margin: 8px 0; color: #4b5563;">
                <strong>Date:</strong> ${formattedDate}
              </p>
              <p style="margin: 8px 0; color: #4b5563;">
                <strong>Time:</strong> ${formattedTime} ${tzAbbr}
              </p>
              <p style="margin: 8px 0; color: #4b5563;">
                <strong>With:</strong> ${otherPerson.full_name || otherPerson.email}
              </p>
            </div>

            ${session.meeting_link ? `
            <div style="text-align: center; margin: 32px 0;">
              <a href="${session.meeting_link}"
                 style="background: linear-gradient(135deg, #2563EB 0%, #1d4ed8 100%);
                        color: white;
                        padding: 14px 32px;
                        text-decoration: none;
                        border-radius: 10px;
                        display: inline-block;
                        font-weight: 600;
                        font-size: 16px;
                        box-shadow: 0 4px 14px rgba(37, 99, 235, 0.4);">
                Join Meeting
              </a>
            </div>` : ''}

            <div style="text-align: center; margin: 24px 0;">
              <a href="${APP_URL}/sessions"
                 style="color: #2563EB; text-decoration: none; font-weight: 500;">
                View in Career Playbook
              </a>
            </div>

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
              to: user.email,
              subject: emailSubject,
              html: emailHtml,
            }),
          });

          if (!resendResponse.ok) {
            const resendError = await resendResponse.text();
            console.error('Resend API error:', resendError);
            errors++;
            continue;
          }
        }

        // Mark reminder as sent
        await supabaseAdmin
          .from('session_reminders')
          .update({
            email_sent: true,
            in_app_sent: true,
          })
          .eq('id', reminder.id);

        // Create in-app notification
        await supabaseAdmin
          .from('notifications')
          .insert({
            user_id: reminder.user_id,
            type: 'session_reminder',
            title: `Session reminder: ${session.title}`,
            message: `Your session with ${otherPerson.full_name || otherPerson.email} is ${timeUntil}`,
            data: {
              session_id: session.id,
              reminder_type: reminder.reminder_type,
            },
          });

        processed++;
      } catch (err) {
        console.error(`Error processing reminder ${reminder.id}:`, err);
        errors++;
      }
    }

    console.log(`Processed ${processed} reminders, ${errors} errors`);

    return new Response(
      JSON.stringify({
        success: true,
        processed,
        errors,
        total: reminders.length,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error sending session reminders:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Internal server error',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
