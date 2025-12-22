import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const MANAGEMENT_API_TOKEN = Deno.env.get('MANAGEMENT_API_TOKEN')!;
const PROJECT_REF = 'rdufwjhptmlpmjmcibpn';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Verify the user is an admin
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, is_admin')
      .eq('id', user.id)
      .single();

    if (!profile || (profile.role !== 'admin' && profile.role !== 'super_admin' && !profile.is_admin)) {
      return new Response(JSON.stringify({ error: 'Admin access required' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Parse body for POST requests
    let body: any = {};
    if (req.method === 'POST') {
      try {
        const text = await req.text();
        body = text ? JSON.parse(text) : {};
      } catch {
        body = {};
      }
    }

    // Determine action: 'list' (default) or 'update'
    const action = body.action || 'list';

    if (action === 'list') {
      // Fetch current email templates from Supabase Auth config
      const response = await fetch(
        `https://api.supabase.com/v1/projects/${PROJECT_REF}/config/auth`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${MANAGEMENT_API_TOKEN}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch email templates');
      }

      const config = await response.json();

      // Extract only email-related config
      const emailConfig = {
        // Subjects
        subjects: {
          confirmation: config.mailer_subjects_confirmation || '',
          recovery: config.mailer_subjects_recovery || '',
          invite: config.mailer_subjects_invite || '',
          magic_link: config.mailer_subjects_magic_link || '',
          email_change: config.mailer_subjects_email_change || '',
        },
        // Templates
        templates: {
          confirmation: config.mailer_templates_confirmation_content || '',
          recovery: config.mailer_templates_recovery_content || '',
          invite: config.mailer_templates_invite_content || '',
          magic_link: config.mailer_templates_magic_link_content || '',
          email_change: config.mailer_templates_email_change_content || '',
        },
        // SMTP Settings (read-only display)
        smtp: {
          sender_name: config.smtp_sender_name || '',
          admin_email: config.smtp_admin_email || '',
        },
      };

      return new Response(JSON.stringify(emailConfig), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'update') {
      const { templateType, subject, content } = body;

      if (!templateType) {
        return new Response(JSON.stringify({ error: 'Template type required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Map template type to Supabase config keys
      const subjectKey = `mailer_subjects_${templateType}`;
      const contentKey = `mailer_templates_${templateType}_content`;

      const updates: Record<string, string> = {};
      if (subject !== undefined) updates[subjectKey] = subject;
      if (content !== undefined) updates[contentKey] = content;

      const response = await fetch(
        `https://api.supabase.com/v1/projects/${PROJECT_REF}/config/auth`,
        {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${MANAGEMENT_API_TOKEN}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updates),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to update template: ${errorText}`);
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
