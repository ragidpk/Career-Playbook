// AI Prompts Configuration
// All AI prompts used in the application

export interface AIPrompt {
  id: string;
  name: string;
  description: string;
  model: string;
  maxTokens: number;
  temperature: number;
  location: string;
  apiEndpoint: string;
  systemPrompt: string;
  userPromptTemplate: string;
  suggestedAlternatives?: {
    model: string;
    reason: string;
    estimatedCostReduction?: string;
  }[];
}

export const AI_PROMPTS: AIPrompt[] = [
  {
    id: 'canvas-ai-suggestion',
    name: 'Career Canvas AI Suggestion',
    description: 'Generates personalized answers for Career Canvas questions based on career transition goals.',
    model: 'gpt-4o-mini',
    maxTokens: 500,
    temperature: 0.7,
    location: 'supabase/functions/canvas-ai-suggestion/index.ts',
    apiEndpoint: '/functions/v1/canvas-ai-suggestion',
    systemPrompt: 'You are an expert career coach. Provide helpful, personalized career advice.',
    userPromptTemplate: `You are an expert career coach helping someone transition from "{currentRole}" to "{targetRole}".

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
    suggestedAlternatives: [
      {
        model: 'claude-3-haiku',
        reason: 'Faster response time, similar quality for shorter outputs',
        estimatedCostReduction: '50%',
      },
    ],
  },
  {
    id: 'generate-milestones',
    name: '12 Weeks Plan Milestone Generator',
    description: 'Creates a structured 12-week action plan with weekly milestones and subtasks based on Career Canvas data.',
    model: 'gpt-4o-mini',
    maxTokens: 2000,
    temperature: 0.7,
    location: 'supabase/functions/generate-milestones/index.ts',
    apiEndpoint: '/functions/v1/generate-milestones',
    systemPrompt: 'You are an expert career coach. Always respond with valid JSON only.',
    userPromptTemplate: `You are a career coach helping someone create a 12-week (90-day) action plan based on their Career Canvas.

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
    suggestedAlternatives: [
      {
        model: 'gpt-4o',
        reason: 'Better reasoning for complex career planning, more nuanced subtasks',
        estimatedCostReduction: '-200% (higher cost but better quality)',
      },
    ],
  },
  {
    id: 'analyze-resume',
    name: 'Resume ATS Analysis',
    description: 'Comprehensive resume analysis including ATS score, strengths, gaps, and 12-week job search strategy.',
    model: 'gpt-4o-mini',
    maxTokens: 3000,
    temperature: 0.7,
    location: 'api/analyze-resume.ts (Vercel) + supabase/functions/analyze-resume/index.ts',
    apiEndpoint: '/api/analyze-resume',
    systemPrompt: 'You are an expert career counselor and ATS analyzer specializing in the {targetCountry} job market. Always respond with valid JSON only. Be specific, professional, and constructive.',
    userPromptTemplate: `You are a professional career counselor and resume expert specializing in the {targetCountry} job market. Analyze the uploaded resume and provide detailed, constructive feedback in JSON format with the following structure:

{
  "candidate_name": "Full name of the candidate as found in the resume",
  "ats_score": <number between 0-100>,
  "summary": "A brief 2-3 sentence overview of the candidate's profile",
  "experience_level": "Entry-level/Mid-level/Senior/Executive",
  "strengths": ["Array of 3-5 key strengths identified in the resume"],
  "improvements": ["Array of 3-5 specific areas for improvement"],
  "skills_identified": ["Array of all technical and soft skills found"],
  "recommendations": ["Array of 3-5 actionable recommendations to improve the resume"],
  "role_recommendations": ["Array of 3-5 specific job roles suitable for this candidate in the {targetCountry} market"],
  "job_search_approach": ["Array of 5-7 strategic recommendations for approaching job opportunities in {targetCountry}"],
  "ninety_day_strategy": {
    "overview": "Brief overview of the 90-day plan",
    "weeks_1_4": ["Array of 4-5 specific action items for weeks 1-4 (Foundation Phase)"],
    "weeks_5_8": ["Array of 4-5 specific action items for weeks 5-8 (Development Phase)"],
    "weeks_9_12": ["Array of 4-5 specific action items for weeks 9-12 (Implementation Phase)"]
  }
}

IMPORTANT: Extract the candidate's full name from the resume.

Be specific, professional, and constructive in your feedback. Focus on the {targetCountry} job market context, including cultural considerations, visa requirements, and industry-specific opportunities.

Resume content:
{resumeText}

Respond ONLY with valid JSON matching the structure above.`,
    suggestedAlternatives: [
      {
        model: 'gpt-4o',
        reason: 'More accurate ATS scoring and detailed recommendations',
        estimatedCostReduction: '-200%',
      },
      {
        model: 'claude-3.5-sonnet',
        reason: 'Better at nuanced analysis and career advice',
        estimatedCostReduction: '-50%',
      },
    ],
  },
  {
    id: 'improve-summary',
    name: 'Resume Summary Improver',
    description: 'Enhances professional summary sections of resumes to be more impactful and ATS-friendly.',
    model: 'gpt-4o-mini',
    maxTokens: 500,
    temperature: 0.7,
    location: 'api/improve-resume-section.ts',
    apiEndpoint: '/api/improve-resume-section',
    systemPrompt: `You are an expert resume writer and career coach. Your task is to improve professional summaries for resumes.

Rules:
- Keep it concise: 2-3 impactful sentences
- Start with years of experience and main expertise
- Highlight key achievements and skills
- Use action-oriented language
- Make it ATS-friendly (avoid tables, graphics references)
- Don't use first person pronouns (I, my)
- Focus on value the candidate brings to employers`,
    userPromptTemplate: `Improve this professional summary:

"{content}"

Provide only the improved summary, nothing else.`,
    suggestedAlternatives: [
      {
        model: 'claude-3-haiku',
        reason: 'Faster, good for simple text improvements',
        estimatedCostReduction: '60%',
      },
    ],
  },
  {
    id: 'improve-bullet',
    name: 'Resume Bullet Point Improver',
    description: 'Transforms job responsibilities into impactful achievement statements.',
    model: 'gpt-4o-mini',
    maxTokens: 500,
    temperature: 0.7,
    location: 'api/improve-resume-section.ts',
    apiEndpoint: '/api/improve-resume-section',
    systemPrompt: `You are an expert resume writer. Your task is to transform job responsibilities into impactful achievement statements.

Rules:
- Start with a strong action verb (Led, Developed, Increased, etc.)
- Include quantifiable metrics when possible (%, $, time saved)
- Show the impact/result of the action
- Keep it to one concise sentence
- Make it ATS-friendly
- Focus on achievements, not just duties`,
    userPromptTemplate: `Transform this job bullet point into an impactful achievement:
{contextInfo}

"{content}"

Provide only the improved bullet point, nothing else.`,
    suggestedAlternatives: [
      {
        model: 'claude-3-haiku',
        reason: 'Faster response, good for single sentence transformations',
        estimatedCostReduction: '60%',
      },
    ],
  },
];

// Summary statistics
export const AI_PROMPT_STATS = {
  totalPrompts: AI_PROMPTS.length,
  modelsUsed: [...new Set(AI_PROMPTS.map(p => p.model))],
  locations: {
    supabaseEdge: AI_PROMPTS.filter(p => p.location.includes('supabase/functions')).length,
    vercelApi: AI_PROMPTS.filter(p => p.location.includes('api/')).length,
  },
};
