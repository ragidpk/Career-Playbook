// Analyze Resume vs Job Description Edge Function
// Compares resume against JD and provides match analysis

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface JobDescription {
  title: string;
  company: string;
  location?: string;
  description: string;
  requirements: string[];
  skills: string[];
}

interface AnalyzeRequest {
  resumeText: string;
  jobDescription: JobDescription;
}

interface SectionAnalysis {
  score: number;
  feedback: string;
}

interface Improvement {
  section: string;
  current: string;
  suggested: string;
  reason: string;
}

interface AnalysisResult {
  matchScore: number;
  keywordAnalysis: {
    matched: string[];
    missing: string[];
    bonus: string[];
  };
  sectionAnalysis: {
    experience: SectionAnalysis;
    skills: SectionAnalysis;
    education: SectionAnalysis;
  };
  improvements: Improvement[];
  tailoredSummary: string;
  actionItems: string[];
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const openaiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiKey) {
      return new Response(
        JSON.stringify({ error: 'OpenAI API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { resumeText, jobDescription }: AnalyzeRequest = await req.json();

    if (!resumeText || resumeText.length < 100) {
      return new Response(
        JSON.stringify({ error: 'Resume text is required (minimum 100 characters)' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!jobDescription || !jobDescription.description) {
      return new Response(
        JSON.stringify({ error: 'Job description is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const prompt = `You are an expert ATS (Applicant Tracking System) analyzer and career coach. Compare this resume against the job description and provide a detailed analysis.

RESUME:
${resumeText.substring(0, 8000)}

JOB DESCRIPTION:
Title: ${jobDescription.title}
Company: ${jobDescription.company || 'Not specified'}
Location: ${jobDescription.location || 'Not specified'}
Description: ${jobDescription.description}
Requirements: ${JSON.stringify(jobDescription.requirements || [])}
Required Skills: ${JSON.stringify(jobDescription.skills || [])}

Analyze the resume against this job and return ONLY valid JSON with this exact structure:
{
  "matchScore": <number 0-100 representing overall ATS match percentage>,
  "keywordAnalysis": {
    "matched": [<list of important keywords/skills found in BOTH resume and JD>],
    "missing": [<list of important keywords/skills in JD but NOT in resume - these are critical gaps>],
    "bonus": [<list of valuable skills in resume that add extra value even if not in JD>]
  },
  "sectionAnalysis": {
    "experience": {
      "score": <number 0-100>,
      "feedback": "<specific feedback about experience match, include years if relevant>"
    },
    "skills": {
      "score": <number 0-100>,
      "feedback": "<specific feedback about skills match and gaps>"
    },
    "education": {
      "score": <number 0-100>,
      "feedback": "<specific feedback about education/certification match>"
    }
  },
  "improvements": [
    {
      "section": "<which section: Summary, Experience, Skills, or Education>",
      "current": "<what the resume currently says or is missing>",
      "suggested": "<specific text or change to improve ATS score for THIS job>",
      "reason": "<why this change helps match the job better>"
    }
  ],
  "tailoredSummary": "<2-3 sentence professional summary tailored specifically for this job, highlighting relevant experience and skills>",
  "actionItems": [
    "<priority action 1 - most impactful change>",
    "<priority action 2>",
    "<priority action 3>",
    "<priority action 4>",
    "<priority action 5>"
  ]
}

Important guidelines:
- Be specific with keywords - use exact terms from the JD
- The matchScore should realistically reflect how well the resume matches
- Improvements should be actionable and specific to this job
- The tailoredSummary should be ready to use in the resume
- Action items should be ordered by impact (most important first)
- Focus on what would help pass ATS screening for THIS specific role`;

    console.log('Calling OpenAI for analysis...');

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are an expert ATS analyzer and career coach. Always return valid JSON. Be specific and actionable in your feedback.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.4,
        max_tokens: 3000,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('OpenAI API error:', response.status, error);
      return new Response(
        JSON.stringify({ error: 'AI analysis failed', details: error }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';

    if (!content) {
      return new Response(
        JSON.stringify({ error: 'No analysis generated' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse the JSON response
    let jsonStr = content.trim();
    if (jsonStr.startsWith('```json')) {
      jsonStr = jsonStr.slice(7);
    }
    if (jsonStr.startsWith('```')) {
      jsonStr = jsonStr.slice(3);
    }
    if (jsonStr.endsWith('```')) {
      jsonStr = jsonStr.slice(0, -3);
    }

    let result: AnalysisResult;
    try {
      result = JSON.parse(jsonStr.trim());
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      console.error('Raw content:', content);
      return new Response(
        JSON.stringify({ error: 'Failed to parse analysis results' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate and ensure all fields exist
    const validatedResult: AnalysisResult = {
      matchScore: Math.min(100, Math.max(0, result.matchScore || 0)),
      keywordAnalysis: {
        matched: result.keywordAnalysis?.matched || [],
        missing: result.keywordAnalysis?.missing || [],
        bonus: result.keywordAnalysis?.bonus || [],
      },
      sectionAnalysis: {
        experience: result.sectionAnalysis?.experience || { score: 0, feedback: 'Unable to analyze' },
        skills: result.sectionAnalysis?.skills || { score: 0, feedback: 'Unable to analyze' },
        education: result.sectionAnalysis?.education || { score: 0, feedback: 'Unable to analyze' },
      },
      improvements: result.improvements || [],
      tailoredSummary: result.tailoredSummary || '',
      actionItems: result.actionItems || [],
    };

    return new Response(
      JSON.stringify(validatedResult),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Analyze resume-jd error:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Analysis failed',
        details: String(error)
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
