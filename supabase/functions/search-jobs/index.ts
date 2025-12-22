// Search Jobs Edge Function
// Uses OpenAI API for job search

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SearchRequest {
  keywords: string;
  location: string;
  radius?: number;
  salary?: number;
  page?: number;
  location_type?: string;
}

interface ExternalJob {
  id: string;
  provider: string;
  provider_job_id: string;
  canonical_url: string | null;
  title: string;
  company_name: string;
  location: string;
  location_type: 'remote' | 'hybrid' | 'onsite' | null;
  description_snippet: string | null;
  posted_at: string | null;
  apply_url: string | null;
  salary_min: number | null;
  salary_max: number | null;
  salary_currency: string;
}

// Generate a deterministic ID from job details
function generateJobId(title: string, company: string, location: string): string {
  const str = `${title}|${company}|${location}`;
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return `ai_${Math.abs(hash).toString(16)}`;
}

// Detect location type from text
function detectLocationType(text: string): 'remote' | 'hybrid' | 'onsite' | null {
  const lower = text.toLowerCase();
  if (lower.includes('remote') || lower.includes('work from home') || lower.includes('wfh')) {
    return 'remote';
  }
  if (lower.includes('hybrid')) {
    return 'hybrid';
  }
  if (lower.includes('onsite') || lower.includes('on-site') || lower.includes('in office')) {
    return 'onsite';
  }
  return null;
}

// Parse salary from text
function parseSalaryFromText(text: string): { min: number | null; max: number | null; currency: string } {
  // Detect currency
  let currency = 'USD';
  if (text.includes('AED') || text.includes('dirham')) currency = 'AED';
  else if (text.includes('SAR') || text.includes('riyal')) currency = 'SAR';
  else if (text.includes('QAR')) currency = 'QAR';
  else if (text.includes('KWD') || text.includes('dinar')) currency = 'KWD';
  else if (text.includes('BHD')) currency = 'BHD';
  else if (text.includes('OMR')) currency = 'OMR';
  else if (text.includes('€') || text.includes('EUR')) currency = 'EUR';
  else if (text.includes('£') || text.includes('GBP')) currency = 'GBP';

  // Extract numbers that look like salaries (4+ digits)
  const numbers = text.match(/[\d,]+/g);
  if (!numbers) return { min: null, max: null, currency };

  const values = numbers
    .map(n => parseInt(n.replace(/,/g, ''), 10))
    .filter(n => !isNaN(n) && n >= 1000); // Only consider numbers >= 1000 as salary

  if (values.length >= 2) {
    return { min: Math.min(...values), max: Math.max(...values), currency };
  } else if (values.length === 1) {
    return { min: values[0], max: null, currency };
  }

  return { min: null, max: null, currency };
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

    // Parse request
    const { keywords, location, salary, location_type }: SearchRequest = await req.json();

    if (!keywords || !location) {
      return new Response(
        JSON.stringify({ error: 'keywords and location are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Build search prompt
    const workTypeFilter = location_type ? ` Focus on ${location_type} positions.` : '';
    const salaryFilter = salary ? ` Target salary range above ${salary}.` : '';

    const searchPrompt = `Generate a list of realistic job openings for "${keywords}" positions in ${location}.${workTypeFilter}${salaryFilter}

Create 12-15 job listings that reflect current market demand and typical companies hiring for this role in this region. Include a mix of:
- Well-known companies in the region
- Startups and growing companies
- Multinational corporations with offices there

For each job, provide:
- title: Specific job title (vary seniority levels)
- company: Real company name that operates in ${location}
- location: Specific city/area
- description: 2-3 sentence job description with key requirements
- salary: Realistic salary range for the region (use local currency like AED for UAE, SAR for Saudi Arabia, etc.)
- workType: remote, hybrid, or onsite
- requirements: 2-3 key requirements

Return ONLY a valid JSON array, no markdown, no explanation.

Example format:
[
  {
    "title": "Senior Software Engineer",
    "company": "Careem",
    "location": "Dubai, UAE",
    "description": "Join our engineering team to build scalable microservices. Work on high-traffic systems serving millions of users across MENA region.",
    "salary": "AED 28,000 - 40,000/month",
    "workType": "hybrid",
    "requirements": "5+ years experience, Node.js/Python, AWS"
  }
]`;

    console.log('Using OpenAI API for job search');
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
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
            content: `You are a job market expert for the Middle East and GCC region. Generate realistic job listings based on actual market conditions, real companies operating in the region, and typical compensation packages. Use local currencies (AED for UAE, SAR for Saudi Arabia, QAR for Qatar, KWD for Kuwait, BHD for Bahrain, OMR for Oman). Include companies like Careem, Noon, Talabat, Emirates NBD, ADNOC, Saudi Aramco, STC, Majid Al Futtaim, Emaar, and other regional employers.`,
          },
          {
            role: 'user',
            content: searchPrompt,
          },
        ],
        temperature: 0.8,
        max_tokens: 4000,
      }),
    });

    if (!openaiResponse.ok) {
      const errorText = await openaiResponse.text();
      console.error('OpenAI API error:', openaiResponse.status, errorText);
      return new Response(
        JSON.stringify({ error: 'Failed to search jobs', details: errorText }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const openaiData = await openaiResponse.json();
    const responseText = openaiData.choices?.[0]?.message?.content || '';

    if (!responseText) {
      return new Response(
        JSON.stringify({ error: 'No response from AI', jobs: [], totalCount: 0 }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse the response
    let jobListings: Array<{
      title: string;
      company: string;
      location: string;
      description?: string;
      salary?: string;
      url?: string;
      workType?: string;
      requirements?: string;
    }> = [];

    try {
      // Extract JSON from response (handle markdown code blocks)
      const jsonMatch = responseText.match(/```json\n?([\s\S]*?)\n?```/) ||
                        responseText.match(/```\n?([\s\S]*?)\n?```/) ||
                        responseText.match(/\[[\s\S]*\]/);
      const jsonStr = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : responseText;
      jobListings = JSON.parse(jsonStr);
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      console.error('Response text:', responseText);
      return new Response(
        JSON.stringify({
          error: 'Failed to parse job listings',
          jobs: [],
          totalCount: 0,
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Map to our ExternalJob format
    const jobs: ExternalJob[] = jobListings.map((job) => {
      const jobId = generateJobId(job.title, job.company, job.location);
      const locationType = job.workType ?
        detectLocationType(job.workType) :
        detectLocationType(`${job.title} ${job.location} ${job.description || ''}`);
      const salaryInfo = job.salary ? parseSalaryFromText(job.salary) : { min: null, max: null, currency: 'USD' };

      // Build description with requirements if available
      let description = job.description || '';
      if (job.requirements) {
        description += ` Requirements: ${job.requirements}`;
      }

      return {
        id: jobId,
        provider: 'openai',
        provider_job_id: jobId,
        canonical_url: null,
        title: job.title,
        company_name: job.company,
        location: job.location,
        location_type: locationType,
        description_snippet: description || null,
        posted_at: null,
        apply_url: null,
        salary_min: salaryInfo.min,
        salary_max: salaryInfo.max,
        salary_currency: salaryInfo.currency,
      };
    });

    return new Response(
      JSON.stringify({
        jobs,
        totalCount: jobs.length,
        page: 1,
        provider: 'openai',
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Search jobs error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: String(error) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
