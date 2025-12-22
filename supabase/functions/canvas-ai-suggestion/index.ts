import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CanvasAISuggestionRequest {
  questionNumber: number;
  questionText: string;
  currentRole: string;
  targetRole: string;
  previousAnswers?: Record<string, string>;
}

interface AIPromptConfig {
  model: string;
  max_tokens: number;
  temperature: number;
  system_prompt: string;
  user_prompt_template: string;
}

// Default prompt config (fallback if DB fetch fails)
const DEFAULT_PROMPT: AIPromptConfig = {
  model: 'gpt-4o-mini',
  max_tokens: 500,
  temperature: 0.7,
  system_prompt: 'You are an expert career coach. Provide helpful, personalized career advice.',
  user_prompt_template: `You are an expert career coach helping someone transition from "{currentRole}" to "{targetRole}".

The user needs to answer this career canvas question:
"{questionText}"

{previousAnswersContext}

Generate a thoughtful, personalized response for this person. The response should:
1. Be written in first person ("I", "my")
2. Be specific to transitioning from {currentRole} to {targetRole}
3. Be actionable and practical
4. Be 150-250 words
5. Sound natural and authentic, not generic

Respond with just the suggestion text, no preamble or explanation.`,
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log('=== CANVAS AI SUGGESTION STARTED ===');

    // Validate Authorization
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Missing or invalid authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Get user from JWT
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Authentication failed' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    console.log('User authenticated:', user.id);

    // Parse request
    const { questionNumber, questionText, currentRole, targetRole, previousAnswers }: CanvasAISuggestionRequest = await req.json();

    if (!questionNumber || !questionText) {
      return new Response(
        JSON.stringify({ error: 'Missing question information' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get OpenAI API key
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiApiKey) {
      return new Response(
        JSON.stringify({ error: 'AI service is not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch prompt config from database
    let promptConfig: AIPromptConfig = DEFAULT_PROMPT;
    try {
      const { data: dbPrompt, error: promptError } = await supabaseClient
        .from('ai_prompts')
        .select('model, max_tokens, temperature, system_prompt, user_prompt_template')
        .eq('id', 'canvas-ai-suggestion')
        .eq('is_active', true)
        .single();

      if (!promptError && dbPrompt) {
        promptConfig = dbPrompt;
        console.log('Using prompt config from database');
      } else {
        console.log('Using default prompt config (DB fetch failed or prompt inactive)');
      }
    } catch (e) {
      console.log('Error fetching prompt config, using default:', e);
    }

    // Build context from previous answers
    let contextSection = '';
    if (previousAnswers && Object.keys(previousAnswers).length > 0) {
      const filledAnswers = Object.entries(previousAnswers)
        .filter(([_, value]) => value && value.trim())
        .map(([key, value]) => `${key}: ${value}`)
        .join('\n');
      if (filledAnswers) {
        contextSection = `\n\nPrevious answers from this user:\n${filledAnswers}`;
      }
    }

    // Build the user prompt from template
    const userPrompt = promptConfig.user_prompt_template
      .replace(/{currentRole}/g, currentRole)
      .replace(/{targetRole}/g, targetRole)
      .replace(/{questionText}/g, questionText)
      .replace(/{previousAnswersContext}/g, contextSection);

    // Generate suggestion with OpenAI
    console.log('Generating suggestion with model:', promptConfig.model);

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiApiKey}`,
      },
      body: JSON.stringify({
        model: promptConfig.model,
        messages: [
          {
            role: 'system',
            content: promptConfig.system_prompt,
          },
          {
            role: 'user',
            content: userPrompt,
          },
        ],
        temperature: promptConfig.temperature,
        max_tokens: promptConfig.max_tokens,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('OpenAI API error:', response.status, errorData);
      return new Response(
        JSON.stringify({ error: 'AI service temporarily unavailable' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    const suggestion = data.choices[0]?.message?.content;

    if (!suggestion) {
      return new Response(
        JSON.stringify({ error: 'Failed to generate suggestion' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Suggestion generated successfully');

    return new Response(
      JSON.stringify({ suggestion: suggestion.trim() }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error in canvas-ai-suggestion:', error);
    return new Response(
      JSON.stringify({ error: 'An error occurred. Please try again.' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
