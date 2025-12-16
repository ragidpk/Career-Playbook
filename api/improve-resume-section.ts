import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

// Environment variables
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || process.env.VITE_OPENAI_API_KEY;

interface ImprovementRequest {
  type: 'summary' | 'bullet' | 'full';
  content: string;
  context?: {
    position?: string;
    company?: string;
    industry?: string;
  };
}

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-client-info, apikey',
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Set CORS headers on all responses
  Object.entries(corsHeaders).forEach(([key, value]) => {
    res.setHeader(key, value);
  });

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Validate environment variables
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !OPENAI_API_KEY) {
      console.error('Missing environment variables');
      return res.status(500).json({ error: 'Server configuration error' });
    }

    // Validate Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing or invalid authorization header' });
    }

    const token = authHeader.replace('Bearer ', '');

    // Create Supabase client and validate user
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Parse request body
    const body = req.body as ImprovementRequest;
    const { type, content, context } = body;

    if (!type || !content) {
      return res.status(400).json({ error: 'Missing required fields: type and content' });
    }

    // Build prompt based on type
    let systemPrompt = '';
    let userPrompt = '';

    if (type === 'summary') {
      systemPrompt = `You are an expert resume writer and career coach. Your task is to improve professional summaries for resumes.

Rules:
- Keep it concise: 2-3 impactful sentences
- Start with years of experience and main expertise
- Highlight key achievements and skills
- Use action-oriented language
- Make it ATS-friendly (avoid tables, graphics references)
- Don't use first person pronouns (I, my)
- Focus on value the candidate brings to employers`;

      userPrompt = `Improve this professional summary:\n\n"${content}"\n\nProvide only the improved summary, nothing else.`;
    } else if (type === 'bullet') {
      systemPrompt = `You are an expert resume writer. Your task is to transform job responsibilities into impactful achievement statements.

Rules:
- Start with a strong action verb (Led, Developed, Increased, etc.)
- Include quantifiable metrics when possible (%, $, time saved)
- Show the impact/result of the action
- Keep it to one concise sentence
- Make it ATS-friendly
- Focus on achievements, not just duties`;

      const contextInfo = context?.position && context?.company
        ? `\nContext: This is for a ${context.position} role at ${context.company}.`
        : '';

      userPrompt = `Transform this job bullet point into an impactful achievement:${contextInfo}\n\n"${content}"\n\nProvide only the improved bullet point, nothing else.`;
    } else {
      return res.status(400).json({ error: 'Invalid type. Use "summary" or "bullet".' });
    }

    // Call OpenAI API
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 500,
      }),
    });

    if (!openaiResponse.ok) {
      const errorData = await openaiResponse.json();
      console.error('OpenAI API error:', errorData);
      return res.status(500).json({ error: 'Failed to improve content. Please try again.' });
    }

    const openaiData = await openaiResponse.json();
    const improved = openaiData.choices?.[0]?.message?.content?.trim();

    if (!improved) {
      return res.status(500).json({ error: 'No improvement generated' });
    }

    return res.status(200).json({
      improved,
      suggestions: [],
    });

  } catch (error) {
    console.error('Error in improve-resume-section:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
