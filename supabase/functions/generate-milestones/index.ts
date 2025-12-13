import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CareerCanvasData {
  section_1_helpers?: string;
  section_2_activities?: string;
  section_3_value?: string;
  section_4_interactions?: string;
  section_5_convince?: string;
  section_6_skills?: string;
  section_7_motivation?: string;
  section_8_sacrifices?: string;
  section_9_outcomes?: string;
}

interface GenerateMilestonesRequest {
  planId: string;
  canvasData: CareerCanvasData;
}

interface WeeklyMilestone {
  week: number;
  goal: string;
  focus_area: string;
}

class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public userMessage: string = 'An error occurred. Please try again.'
  ) {
    super(message);
    this.name = 'AppError';
  }
}

function handleError(error: unknown): Response {
  console.error('Error in generate-milestones function:', error);

  let statusCode = 500;
  let userMessage = 'Failed to generate milestones. Please try again.';

  if (error instanceof AppError) {
    statusCode = error.statusCode;
    userMessage = error.userMessage;
  }

  return new Response(
    JSON.stringify({ error: userMessage }),
    {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: statusCode,
    }
  );
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log('=== GENERATE MILESTONES STARTED ===');

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
      throw new AppError('Authentication failed', 401, 'Please sign in again.');
    }
    console.log('User authenticated:', user.id);

    // Parse request
    const { planId, canvasData }: GenerateMilestonesRequest = await req.json();

    if (!planId) {
      throw new AppError('Missing planId', 400, 'Plan ID is required.');
    }

    // Verify plan ownership
    const { data: plan, error: planError } = await supabaseClient
      .from('ninety_day_plans')
      .select('id, user_id')
      .eq('id', planId)
      .single();

    if (planError || !plan) {
      throw new AppError('Plan not found', 404, 'Plan not found.');
    }

    if (plan.user_id !== user.id) {
      throw new AppError('Unauthorized access to plan', 403, 'You do not have permission to modify this plan.');
    }

    // Build career canvas context
    const canvasContext = buildCanvasContext(canvasData);

    if (!canvasContext || canvasContext.length < 50) {
      throw new AppError(
        'Insufficient canvas data',
        400,
        'Please complete more sections of your Career Plans before generating milestones.'
      );
    }

    // Get OpenAI API key
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiApiKey) {
      throw new AppError('OpenAI not configured', 500, 'AI service is not configured. Please contact support.');
    }

    // Generate milestones with OpenAI
    console.log('Generating milestones with OpenAI...');
    const milestones = await generateMilestonesWithAI(canvasContext, openaiApiKey);
    console.log('Generated', milestones.length, 'milestones');

    // Get existing milestones for the plan
    const { data: existingMilestones, error: fetchError } = await supabaseClient
      .from('weekly_milestones')
      .select('id, week_number')
      .eq('plan_id', planId)
      .order('week_number', { ascending: true });

    if (fetchError) {
      throw new AppError('Failed to fetch milestones', 500, 'Could not update milestones.');
    }

    // Update each milestone with AI-generated content
    const updatePromises = milestones.map((milestone) => {
      const existingMilestone = existingMilestones?.find(m => m.week_number === milestone.week);
      if (existingMilestone) {
        return supabaseClient
          .from('weekly_milestones')
          .update({ goal: milestone.goal.slice(0, 200) }) // Enforce 200 char limit
          .eq('id', existingMilestone.id);
      }
      return Promise.resolve({ error: null });
    });

    const results = await Promise.all(updatePromises);
    const errors = results.filter(r => r.error);

    if (errors.length > 0) {
      console.error('Some milestone updates failed:', errors);
    }

    console.log('Milestones updated successfully');

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Milestones generated successfully',
        milestones: milestones,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    return handleError(error);
  }
});

function buildCanvasContext(canvas: CareerCanvasData): string {
  const sections = [
    { label: 'Who I Help', value: canvas.section_1_helpers },
    { label: 'Activities I Do', value: canvas.section_2_activities },
    { label: 'Value I Provide', value: canvas.section_3_value },
    { label: 'How I Interact', value: canvas.section_4_interactions },
    { label: 'How I Convince', value: canvas.section_5_convince },
    { label: 'Skills I Need', value: canvas.section_6_skills },
    { label: 'What Motivates Me', value: canvas.section_7_motivation },
    { label: 'Sacrifices I Will Make', value: canvas.section_8_sacrifices },
    { label: 'Outcomes I Want', value: canvas.section_9_outcomes },
  ];

  return sections
    .filter(s => s.value && s.value.trim())
    .map(s => `${s.label}: ${s.value}`)
    .join('\n\n');
}

async function generateMilestonesWithAI(
  canvasContext: string,
  apiKey: string
): Promise<WeeklyMilestone[]> {
  const prompt = `You are a career coach helping someone create a 12-week (90-day) action plan based on their Career Canvas.

Based on the following Career Canvas information, generate 12 weekly milestones that will help this person achieve their career goals. Each milestone should be a specific, actionable goal that can be accomplished in one week.

Career Canvas:
${canvasContext}

Generate exactly 12 weekly milestones. Each milestone should:
1. Be specific and actionable
2. Build progressively toward their career goals
3. Be achievable within a single week
4. Be under 200 characters

Respond ONLY with valid JSON in this exact format:
{
  "milestones": [
    { "week": 1, "goal": "Specific actionable goal for week 1", "focus_area": "networking" },
    { "week": 2, "goal": "Specific actionable goal for week 2", "focus_area": "skills" },
    ...
  ]
}

Focus areas can be: networking, skills, personal-brand, job-search, interview-prep, portfolio, research, or other relevant areas.`;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are an expert career coach. Always respond with valid JSON only.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 2000,
    }),
  });

  if (!response.ok) {
    const errorData = await response.text();
    console.error('OpenAI API error:', response.status, errorData);
    throw new AppError(
      `OpenAI API error: ${response.status}`,
      500,
      'AI service is temporarily unavailable. Please try again later.'
    );
  }

  const data = await response.json();
  const content = data.choices[0]?.message?.content;

  if (!content) {
    throw new AppError('No response from OpenAI', 500, 'Failed to generate milestones. Please try again.');
  }

  try {
    const parsed = JSON.parse(content);

    if (!Array.isArray(parsed.milestones) || parsed.milestones.length !== 12) {
      throw new Error('Invalid milestone count');
    }

    return parsed.milestones.map((m: any, index: number) => ({
      week: m.week || index + 1,
      goal: String(m.goal || '').slice(0, 200),
      focus_area: m.focus_area || 'general',
    }));
  } catch (parseError) {
    console.error('Failed to parse OpenAI response:', content);
    throw new AppError('Failed to parse AI response', 500, 'Could not process AI response. Please try again.');
  }
}
