// Job Recommendations Edge Function
// Uses Claude API to generate personalized job title recommendations based on user's career profile
// Supports GET to fetch saved recommendations and POST to generate/refresh

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import Anthropic from 'https://esm.sh/@anthropic-ai/sdk@0.32.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface JobRecommendationsInput {
  targetRole: string;
  currentRole?: string;
  skills?: string;
  locations?: string[];
  seniority?: string;
  industry?: string;
  workType?: string;
  forceRefresh?: boolean; // If true, regenerate even if saved recommendations exist
}

interface JobRecommendationsOutput {
  bestMatchTitles: string[];
  adjacentTitles: string[];
  titleVariations: string[];
  keywordPack: string[];
  positioningSummary: string;
}

interface SavedRecommendation {
  id: string;
  user_id: string;
  target_role: string;
  current_role: string | null;
  skills: string | null;
  locations: string[] | null;
  seniority: string | null;
  industry: string | null;
  work_type: string | null;
  best_match_titles: string[];
  adjacent_titles: string[];
  title_variations: string[];
  keyword_pack: string[];
  positioning_summary: string | null;
  created_at: string;
  updated_at: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get auth token
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authorization required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify user
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Handle GET request - fetch saved recommendations
    if (req.method === 'GET') {
      const { data: saved, error: fetchError } = await supabase
        .from('user_job_recommendations')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        console.error('Error fetching saved recommendations:', fetchError);
      }

      if (saved) {
        const recommendations: JobRecommendationsOutput = {
          bestMatchTitles: saved.best_match_titles || [],
          adjacentTitles: saved.adjacent_titles || [],
          titleVariations: saved.title_variations || [],
          keywordPack: saved.keyword_pack || [],
          positioningSummary: saved.positioning_summary || '',
        };

        return new Response(
          JSON.stringify({
            recommendations,
            savedAt: saved.updated_at,
            input: {
              targetRole: saved.target_role,
              currentRole: saved.current_role,
              skills: saved.skills,
              locations: saved.locations,
              seniority: saved.seniority,
              industry: saved.industry,
              workType: saved.work_type,
            },
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // No saved recommendations
      return new Response(
        JSON.stringify({ recommendations: null }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Handle POST request - generate new recommendations
    const input: JobRecommendationsInput = await req.json();

    if (!input.targetRole) {
      return new Response(
        JSON.stringify({ error: 'Target role is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check for existing recommendations if not forcing refresh
    if (!input.forceRefresh) {
      const { data: saved } = await supabase
        .from('user_job_recommendations')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (saved) {
        const recommendations: JobRecommendationsOutput = {
          bestMatchTitles: saved.best_match_titles || [],
          adjacentTitles: saved.adjacent_titles || [],
          titleVariations: saved.title_variations || [],
          keywordPack: saved.keyword_pack || [],
          positioningSummary: saved.positioning_summary || '',
        };

        return new Response(
          JSON.stringify({
            recommendations,
            savedAt: saved.updated_at,
            fromCache: true,
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Get prompt from ai_prompts table
    const { data: promptData } = await supabase
      .from('ai_prompts')
      .select('*')
      .eq('id', 'job-recommendations')
      .single();

    // Use stored prompt or fallback
    const systemPrompt = promptData?.system_prompt ||
      'You are a senior career strategist and job-market analyst. Provide specific, actionable job search recommendations.';

    const userPromptTemplate = promptData?.user_prompt_template || getDefaultUserPrompt();

    // Build the user prompt with inputs
    const userPrompt = userPromptTemplate
      .replace('{{target_role}}', input.targetRole)
      .replace('{{current_role}}', input.currentRole || 'Not specified')
      .replace('{{skills}}', input.skills || 'Not specified')
      .replace('{{locations}}', input.locations?.join(', ') || 'Any location')
      .replace('{{seniority}}', input.seniority || 'Not specified')
      .replace('{{industry}}', input.industry || 'Any industry')
      .replace('{{work_type}}', input.workType || 'Any');

    // Try Claude first, fallback to OpenAI
    const anthropicKey = Deno.env.get('ANTHROPIC_API_KEY');
    const openaiKey = Deno.env.get('OPENAI_API_KEY');

    if (!anthropicKey && !openaiKey) {
      return new Response(
        JSON.stringify({ error: 'No AI API configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let responseText = '';

    if (anthropicKey) {
      // Use Claude
      const anthropic = new Anthropic({ apiKey: anthropicKey });
      const message = await anthropic.messages.create({
        model: promptData?.model?.includes('claude') ? promptData.model : 'claude-3-5-sonnet-20241022',
        max_tokens: promptData?.max_tokens || 2000,
        messages: [{ role: 'user', content: userPrompt }],
        system: systemPrompt,
      });
      responseText = message.content[0].type === 'text' ? message.content[0].text : '';
    } else {
      // Use OpenAI
      const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${openaiKey}`,
        },
        body: JSON.stringify({
          model: promptData?.model?.includes('gpt') ? promptData.model : 'gpt-4o-mini',
          max_tokens: promptData?.max_tokens || 2000,
          temperature: promptData?.temperature || 0.7,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
        }),
      });

      if (!openaiResponse.ok) {
        const err = await openaiResponse.text();
        throw new Error(`OpenAI error: ${err}`);
      }

      const openaiData = await openaiResponse.json();
      responseText = openaiData.choices[0]?.message?.content || '';
    }

    // Parse response

    // Try to parse as JSON
    let recommendations: JobRecommendationsOutput;
    try {
      // Extract JSON from response (handle markdown code blocks)
      const jsonMatch = responseText.match(/```json\n?([\s\S]*?)\n?```/) ||
                        responseText.match(/\{[\s\S]*\}/);
      const jsonStr = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : responseText;
      recommendations = JSON.parse(jsonStr);
    } catch (parseError) {
      console.error('Failed to parse AI response as JSON:', parseError);
      // Return raw response if parsing fails
      return new Response(
        JSON.stringify({
          error: 'Failed to parse recommendations',
          rawResponse: responseText
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Save recommendations to database (upsert to handle existing records)
    const { error: saveError } = await supabase
      .from('user_job_recommendations')
      .upsert({
        user_id: user.id,
        target_role: input.targetRole,
        current_role: input.currentRole || null,
        skills: input.skills || null,
        locations: input.locations || null,
        seniority: input.seniority || null,
        industry: input.industry || null,
        work_type: input.workType || null,
        best_match_titles: recommendations.bestMatchTitles || [],
        adjacent_titles: recommendations.adjacentTitles || [],
        title_variations: recommendations.titleVariations || [],
        keyword_pack: recommendations.keywordPack || [],
        positioning_summary: recommendations.positioningSummary || null,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id',
      });

    if (saveError) {
      console.error('Error saving recommendations:', saveError);
      // Continue anyway - don't fail the request just because save failed
    }

    return new Response(
      JSON.stringify({
        recommendations,
        savedAt: new Date().toISOString(),
        fromCache: false,
      }),
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

function getDefaultUserPrompt(): string {
  return `Act as a senior career strategist and job-market analyst.

INPUTS
- Target Role: {{target_role}}
- Current Role: {{current_role}}
- Skills: {{skills}}
- Preferred Locations: {{locations}}
- Seniority Level: {{seniority}}
- Industry: {{industry}}
- Work Type Preference: {{work_type}}

TASK
Based on the inputs above, provide job search recommendations in the following JSON format:

{
  "bestMatchTitles": ["8-15 job titles that directly match the target role"],
  "adjacentTitles": ["8-15 related job titles in adjacent fields"],
  "titleVariations": ["8-15 alternative titles recruiters commonly use"],
  "keywordPack": ["20-40 keywords for job alerts and searches"],
  "positioningSummary": "A short positioning summary (max 80 words) explaining how to present yourself for these roles"
}

GUIDELINES:
- Be specific to the provided inputs
- Include titles at appropriate seniority levels
- Consider regional job market variations for the specified locations
- Include both traditional and emerging role titles
- Keywords should include skills, tools, certifications, and industry terms

Respond ONLY with valid JSON, no additional text.`;
}
