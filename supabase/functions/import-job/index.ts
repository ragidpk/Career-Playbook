// Import Job Edge Function
// Creates external_jobs records with service_role access

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ImportJobRequest {
  url: string;
  title: string;
  company_name: string;
  location?: string;
  location_type?: 'remote' | 'hybrid' | 'onsite';
  description_snippet?: string;
  salary_min?: number;
  salary_max?: number;
  salary_currency?: string;
}

function normalizeJobUrl(url: string): string {
  try {
    const parsed = new URL(url);
    // Remove tracking parameters
    const trackingParams = ['utm_source', 'utm_medium', 'utm_campaign', 'ref', 'refId', 'trackingId'];
    trackingParams.forEach(param => parsed.searchParams.delete(param));
    // Remove trailing slashes
    parsed.pathname = parsed.pathname.replace(/\/+$/, '');
    return parsed.toString();
  } catch {
    return url;
  }
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify auth
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase client with service role for insert
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify user token
    const supabaseAnon = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!);
    const { data: { user }, error: authError } = await supabaseAnon.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body: ImportJobRequest = await req.json();

    // Validate required fields
    if (!body.url || !body.title || !body.company_name) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: url, title, company_name' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Normalize URL
    const canonicalUrl = normalizeJobUrl(body.url);

    // Check if job already exists
    const { data: existing } = await supabase
      .from('external_jobs')
      .select('*')
      .eq('canonical_url', canonicalUrl)
      .single();

    if (existing) {
      return new Response(
        JSON.stringify({ job: existing, existed: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create new external job
    const { data: job, error: insertError } = await supabase
      .from('external_jobs')
      .insert({
        provider: 'manual_url',
        provider_job_id: `manual_${Date.now()}_${user.id.substring(0, 8)}`,
        canonical_url: canonicalUrl,
        title: body.title,
        company_name: body.company_name,
        location: body.location || null,
        location_type: body.location_type || null,
        description_snippet: body.description_snippet || null,
        apply_url: body.url,
        salary_min: body.salary_min || null,
        salary_max: body.salary_max || null,
        salary_currency: body.salary_currency || 'USD',
        raw: { original_url: body.url, imported_by: user.id },
      })
      .select()
      .single();

    if (insertError) {
      console.error('Insert error:', insertError);
      return new Response(
        JSON.stringify({ error: 'Failed to import job', details: insertError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ job, existed: false }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: String(error) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
