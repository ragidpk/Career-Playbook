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

interface Subtask {
  text: string;
  completed: boolean;
}

interface WeeklyMilestone {
  week: number;
  title: string;
  subtasks: Subtask[];
  category: 'foundation' | 'skill_development' | 'networking' | 'job_search';
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

interface AIPromptConfig {
  model: string;
  max_tokens: number;
  temperature: number;
  system_prompt: string;
  user_prompt_template: string;
}

// Default prompt config (fallback if DB fetch fails)
const DEFAULT_MILESTONE_PROMPT: AIPromptConfig = {
  model: 'gpt-4o-mini',
  max_tokens: 2000,
  temperature: 0.7,
  system_prompt: 'You are an expert career coach. Always respond with valid JSON only.',
  user_prompt_template: `You are a career coach helping someone create a 12-week (90-day) action plan based on their Career Canvas.

Based on the following Career Canvas information, generate 12 weekly milestones that will help this person achieve their career goals.

Career Canvas:
{canvasContext}

Generate exactly 12 weekly milestones. Each milestone should have:
1. A short title (2-4 words) describing the week's focus
2. Exactly 3 specific, actionable subtasks that can be completed that week
3. A category that matches the phase of the career journey

Categories should follow this progression:
- Weeks 1-3: "foundation" (research, self-assessment, learning basics)
- Weeks 4-6: "skill_development" (building skills, certifications, practice)
- Weeks 7-9: "networking" (connecting, outreach, building relationships)
- Weeks 10-12: "job_search" (applications, interviews, negotiations)

Respond ONLY with valid JSON in this exact format:
{
  "milestones": [
    {
      "week": 1,
      "title": "PM Foundations",
      "subtasks": ["Read 'Inspired' by Marty Cagan", "Complete PM skills assessment", "Identify skill gaps"],
      "category": "foundation"
    }
  ]
}

Make subtasks specific, measurable, and achievable within a single week.`,
};

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

    // Verify plan ownership and get parent plan info
    const { data: plan, error: planError } = await supabaseClient
      .from('ninety_day_plans')
      .select('id, user_id, parent_plan_id, sequence_number')
      .eq('id', planId)
      .single();

    if (planError || !plan) {
      throw new AppError('Plan not found', 404, 'Plan not found.');
    }

    if (plan.user_id !== user.id) {
      throw new AppError('Unauthorized access to plan', 403, 'You do not have permission to modify this plan.');
    }

    // If this is a continuation plan, fetch previous plan's milestones
    let previousMilestones: string[] = [];
    if (plan.parent_plan_id) {
      console.log('This is a continuation plan, fetching previous milestones...');
      const { data: parentMilestones } = await supabaseClient
        .from('weekly_milestones')
        .select('goal, subtasks')
        .eq('plan_id', plan.parent_plan_id)
        .order('week_number', { ascending: true });

      if (parentMilestones && parentMilestones.length > 0) {
        previousMilestones = parentMilestones.map((m: any) => {
          const subtaskTexts = m.subtasks?.map((s: any) => s.text || s).join(', ') || '';
          return `${m.goal}${subtaskTexts ? ` (${subtaskTexts})` : ''}`;
        });
        console.log('Found', previousMilestones.length, 'previous milestones');
      }
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
    const isContinuation = !!plan.parent_plan_id;
    const sequenceNumber = plan.sequence_number || 1;
    const milestones = await generateMilestonesWithAI(
      canvasContext,
      openaiApiKey,
      supabaseClient,
      isContinuation,
      sequenceNumber,
      previousMilestones
    );
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
          .update({
            goal: milestone.title.slice(0, 200), // Title in goal field
            subtasks: milestone.subtasks,
            category: milestone.category,
          })
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
  apiKey: string,
  supabaseClient: any,
  isContinuation: boolean = false,
  sequenceNumber: number = 1,
  previousMilestones: string[] = []
): Promise<WeeklyMilestone[]> {
  // Fetch prompt config from database
  let promptConfig: AIPromptConfig = DEFAULT_MILESTONE_PROMPT;
  try {
    const { data: dbPrompt, error: promptError } = await supabaseClient
      .from('ai_prompts')
      .select('model, max_tokens, temperature, system_prompt, user_prompt_template')
      .eq('id', 'generate-milestones')
      .eq('is_active', true)
      .single();

    if (!promptError && dbPrompt) {
      promptConfig = dbPrompt;
      console.log('Using milestone prompt config from database');
    } else {
      console.log('Using default milestone prompt config');
    }
  } catch (e) {
    console.log('Error fetching milestone prompt config, using default:', e);
  }

  // Build user prompt from template
  let userPrompt = promptConfig.user_prompt_template
    .replace(/{canvasContext}/g, canvasContext);

  // Add continuation context if this is a follow-up plan
  if (isContinuation && previousMilestones.length > 0) {
    const continuationContext = `

IMPORTANT: This is a CONTINUATION PLAN (Part ${sequenceNumber} of the career journey).

The user has ALREADY COMPLETED the following milestones in their previous 12-week plan:
${previousMilestones.map((m, i) => `Week ${i + 1}: ${m}`).join('\n')}

DO NOT repeat any of the above milestones or subtasks. Generate NEW, MORE ADVANCED milestones that:
1. Build upon the skills and progress already achieved
2. Move to the NEXT LEVEL of career development
3. Focus on more advanced goals, deeper specialization, or new challenges
4. Assume foundational work is complete - skip basics and go straight to intermediate/advanced tasks

For a continuation plan, use this progression instead:
- Weeks 1-3: "skill_development" (advanced skills, specializations, certifications)
- Weeks 4-6: "networking" (expanding network, industry events, thought leadership)
- Weeks 7-9: "job_search" (active applications, interview preparation, negotiations)
- Weeks 10-12: "job_search" (final push - interviews, offers, transition planning)
`;
    userPrompt = userPrompt + continuationContext;
  }

  console.log('Generating milestones with model:', promptConfig.model);

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
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
    // Try to extract JSON from the response (AI sometimes adds extra text)
    let jsonContent = content;
    const jsonMatch = content.match(/\{[\s\S]*"milestones"[\s\S]*\}/);
    if (jsonMatch) {
      jsonContent = jsonMatch[0];
    }

    const parsed = JSON.parse(jsonContent);

    if (!Array.isArray(parsed.milestones) || parsed.milestones.length < 10) {
      console.error('Invalid milestones array:', parsed);
      throw new Error('Invalid milestone data');
    }

    const validCategories = ['foundation', 'skill_development', 'networking', 'job_search'];

    // Take first 12 milestones (or pad if less)
    const milestones = parsed.milestones.slice(0, 12);

    // Pad to 12 if we have less
    while (milestones.length < 12) {
      const weekNum = milestones.length + 1;
      milestones.push({
        week: weekNum,
        title: `Week ${weekNum} Goals`,
        subtasks: ['Define weekly objectives', 'Track progress', 'Review and adjust'],
        category: weekNum <= 3 ? 'foundation' : weekNum <= 6 ? 'skill_development' : weekNum <= 9 ? 'networking' : 'job_search'
      });
    }

    return milestones.map((m: any, index: number) => {
      // Convert subtasks array of strings to array of objects
      const subtasks: Subtask[] = (m.subtasks || []).slice(0, 3).map((text: string) => ({
        text: String(text).slice(0, 200),
        completed: false,
      }));

      // Ensure at least 3 subtasks
      while (subtasks.length < 3) {
        subtasks.push({ text: 'Set and track goals', completed: false });
      }

      // Determine category based on week if not provided or invalid
      let category = m.category;
      if (!validCategories.includes(category)) {
        const weekNum = m.week || index + 1;
        if (weekNum <= 3) category = 'foundation';
        else if (weekNum <= 6) category = 'skill_development';
        else if (weekNum <= 9) category = 'networking';
        else category = 'job_search';
      }

      return {
        week: m.week || index + 1,
        title: String(m.title || `Week ${index + 1}`).slice(0, 200),
        subtasks,
        category,
      };
    });
  } catch (parseError) {
    console.error('Failed to parse OpenAI response:', content);
    console.error('Parse error:', parseError);
    throw new AppError('Failed to parse AI response', 500, 'Could not process AI response. Please try again.');
  }
}
