import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
// @ts-expect-error - pdf-parse types may not be available
import pdfParse from 'pdf-parse';

// Environment variables
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || process.env.VITE_OPENAI_API_KEY;

interface ParseRequest {
  fileData: string; // Base64 encoded PDF
  fileName: string;
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
    const body = req.body as ParseRequest;
    const { fileData, fileName } = body;

    if (!fileData) {
      return res.status(400).json({ error: 'Missing file data' });
    }

    // Convert base64 to buffer and parse PDF
    const pdfBuffer = Buffer.from(fileData, 'base64');
    let pdfText = '';

    try {
      const pdfData = await pdfParse(pdfBuffer);
      pdfText = pdfData.text;
    } catch (pdfError) {
      console.error('PDF parse error:', pdfError);
      return res.status(400).json({ error: 'Failed to parse PDF. Please ensure it is a valid PDF file.' });
    }

    if (!pdfText || pdfText.trim().length < 50) {
      return res.status(400).json({ error: 'Could not extract text from PDF. Please try a different file.' });
    }

    // Use OpenAI to extract structured data
    const systemPrompt = `You are an expert at parsing resumes. Extract structured information from the resume text provided.

Return a JSON object with the following structure:
{
  "personal_info": {
    "fullName": "string",
    "email": "string",
    "phone": "string",
    "location": "string",
    "linkedIn": "string or null",
    "website": "string or null",
    "title": "string or null"
  },
  "professional_summary": "string or null",
  "work_experience": [
    {
      "id": "uuid",
      "company": "string",
      "position": "string",
      "location": "string or null",
      "startDate": "YYYY-MM format",
      "endDate": "YYYY-MM format or null",
      "current": boolean,
      "description": "",
      "bullets": ["string array of achievements/responsibilities"]
    }
  ],
  "education": [
    {
      "id": "uuid",
      "institution": "string",
      "degree": "string",
      "field": "string",
      "location": "string or null",
      "startDate": "YYYY-MM format",
      "endDate": "YYYY-MM format or null",
      "current": boolean,
      "gpa": "string or null"
    }
  ],
  "skills": [
    {
      "id": "uuid",
      "name": "string",
      "category": "Technical|Programming Languages|Frameworks|Tools|Soft Skills|Languages|Other"
    }
  ],
  "certifications": [
    {
      "id": "uuid",
      "name": "string",
      "issuer": "string",
      "date": "YYYY-MM format or null"
    }
  ]
}

Rules:
- Generate unique UUIDs for each id field (use format like "exp-1", "edu-1", "skill-1", etc.)
- Parse dates into YYYY-MM format when possible
- If a date is "Present" or similar, set current to true and endDate to null
- Extract bullet points from job descriptions
- Categorize skills appropriately
- If information is not available, use null or empty array
- Return ONLY valid JSON, no markdown or explanations`;

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
          { role: 'user', content: `Parse this resume:\n\n${pdfText.substring(0, 15000)}` }, // Limit text length
        ],
        temperature: 0.3, // Lower temperature for more consistent parsing
        max_tokens: 4000,
        response_format: { type: 'json_object' },
      }),
    });

    if (!openaiResponse.ok) {
      const errorData = await openaiResponse.json();
      console.error('OpenAI API error:', errorData);
      return res.status(500).json({ error: 'Failed to parse resume content. Please try again.' });
    }

    const openaiData = await openaiResponse.json();
    const parsedContent = openaiData.choices?.[0]?.message?.content;

    if (!parsedContent) {
      return res.status(500).json({ error: 'No content parsed from resume' });
    }

    try {
      const resumeData = JSON.parse(parsedContent);
      console.log('Successfully parsed resume for user:', user.id, 'file:', fileName);
      return res.status(200).json(resumeData);
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      return res.status(500).json({ error: 'Failed to process parsed resume data' });
    }

  } catch (error) {
    console.error('Error in parse-resume-pdf:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
