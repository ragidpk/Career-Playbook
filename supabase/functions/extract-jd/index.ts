// Extract Job Description Edge Function
// Extracts JD from URL, file, or text input

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ExtractRequest {
  source: 'url' | 'file' | 'text';
  url?: string;
  fileBase64?: string;
  fileName?: string;
  text?: string;
}

interface JobDescription {
  title: string;
  company: string;
  location: string;
  description: string;
  requirements: string[];
  skills: string[];
  experience: string;
  source: string;
}

// Extract text from HTML
function extractTextFromHtml(html: string): string {
  // Remove script and style tags
  let text = html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
  text = text.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
  // Remove HTML tags
  text = text.replace(/<[^>]+>/g, ' ');
  // Decode HTML entities
  text = text.replace(/&nbsp;/g, ' ');
  text = text.replace(/&amp;/g, '&');
  text = text.replace(/&lt;/g, '<');
  text = text.replace(/&gt;/g, '>');
  text = text.replace(/&quot;/g, '"');
  text = text.replace(/&#39;/g, "'");
  // Normalize whitespace
  text = text.replace(/\s+/g, ' ').trim();
  return text;
}

// Extract JSON-LD data from HTML (used by LinkedIn and others)
function extractJsonLd(html: string): Record<string, unknown> | null {
  const jsonLdMatch = html.match(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/i);
  if (jsonLdMatch) {
    try {
      return JSON.parse(jsonLdMatch[1]);
    } catch {
      return null;
    }
  }
  return null;
}

// Extract meta tags
function extractMetaTags(html: string): Record<string, string> {
  const meta: Record<string, string> = {};

  // Open Graph tags
  const ogMatches = html.matchAll(/<meta\s+property="og:(\w+)"\s+content="([^"]+)"/gi);
  for (const match of ogMatches) {
    meta[`og:${match[1]}`] = match[2];
  }

  // Twitter tags
  const twitterMatches = html.matchAll(/<meta\s+name="twitter:(\w+)"\s+content="([^"]+)"/gi);
  for (const match of twitterMatches) {
    meta[`twitter:${match[1]}`] = match[2];
  }

  // Standard meta description
  const descMatch = html.match(/<meta\s+name="description"\s+content="([^"]+)"/i);
  if (descMatch) {
    meta.description = descMatch[1];
  }

  // Title tag
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  if (titleMatch) {
    meta.title = titleMatch[1].trim();
  }

  return meta;
}

// Use OpenAI to structure the extracted content
async function structureWithOpenAI(
  rawContent: string,
  sourceType: string,
  openaiKey: string
): Promise<JobDescription> {
  const prompt = `Extract job details from this ${sourceType} content. Return ONLY valid JSON with this exact structure:
{
  "title": "Job title",
  "company": "Company name",
  "location": "Job location (city, country)",
  "description": "Full job description text",
  "requirements": ["requirement 1", "requirement 2", ...],
  "skills": ["skill 1", "skill 2", ...],
  "experience": "Years of experience required (e.g., '3-5 years')"
}

Content to extract from:
${rawContent.substring(0, 15000)}`;

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
          content: 'You are a job description parser. Extract structured job details from raw content. Always return valid JSON. If a field cannot be determined, use an empty string or empty array.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.3,
      max_tokens: 2000,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenAI API error: ${response.status} - ${error}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content || '';

  // Parse JSON from response
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

  return JSON.parse(jsonStr.trim());
}

// Fetch and extract from URL
async function extractFromUrl(url: string, openaiKey: string): Promise<JobDescription> {
  console.log('Fetching URL:', url);

  // Fetch the page
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.5',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch URL: ${response.status}`);
  }

  const html = await response.text();

  // Try JSON-LD first (most reliable)
  const jsonLd = extractJsonLd(html);
  if (jsonLd) {
    console.log('Found JSON-LD data');
    // Structure with OpenAI for consistency
    return structureWithOpenAI(JSON.stringify(jsonLd), 'JSON-LD structured data', openaiKey);
  }

  // Extract meta tags
  const meta = extractMetaTags(html);

  // Get main text content
  const textContent = extractTextFromHtml(html);

  // Combine meta and text for OpenAI processing
  const combinedContent = `
URL: ${url}
Title: ${meta.title || meta['og:title'] || ''}
Description: ${meta.description || meta['og:description'] || ''}

Page Content:
${textContent.substring(0, 12000)}
`;

  return structureWithOpenAI(combinedContent, 'webpage', openaiKey);
}

// Extract from file (PDF or DOCX)
async function extractFromFile(
  fileBase64: string,
  fileName: string,
  openaiKey: string
): Promise<JobDescription> {
  console.log('Extracting from file:', fileName);

  // Decode base64
  const binaryStr = atob(fileBase64);
  const bytes = new Uint8Array(binaryStr.length);
  for (let i = 0; i < binaryStr.length; i++) {
    bytes[i] = binaryStr.charCodeAt(i);
  }

  let textContent = '';

  if (fileName.toLowerCase().endsWith('.pdf')) {
    // For PDF, try to extract text using regex patterns
    // This is a simplified approach - in production, use a proper PDF library
    const decoder = new TextDecoder('utf-8', { fatal: false });
    const pdfText = decoder.decode(bytes);

    // Extract text between parentheses (common PDF text encoding)
    const textMatches = pdfText.matchAll(/\(([^)]{2,})\)/g);
    const extractedParts: string[] = [];
    for (const match of textMatches) {
      const text = match[1]
        .replace(/\\n/g, '\n')
        .replace(/\\r/g, '')
        .replace(/\\\(/g, '(')
        .replace(/\\\)/g, ')');
      if (text.length > 1 && !/^[\d\s.]+$/.test(text)) {
        extractedParts.push(text);
      }
    }
    textContent = extractedParts.join(' ');

    // If that didn't work, try another pattern
    if (textContent.length < 100) {
      const streamMatches = pdfText.matchAll(/BT\s*([\s\S]*?)\s*ET/g);
      for (const match of streamMatches) {
        const tjMatches = match[1].matchAll(/\[(.*?)\]\s*TJ/g);
        for (const tj of tjMatches) {
          const texts = tj[1].matchAll(/\(([^)]+)\)/g);
          for (const t of texts) {
            extractedParts.push(t[1]);
          }
        }
      }
      textContent = extractedParts.join(' ');
    }
  } else if (fileName.toLowerCase().endsWith('.docx')) {
    // For DOCX, extract text from the XML content
    // DOCX is a ZIP file containing XML
    const decoder = new TextDecoder('utf-8', { fatal: false });
    const docxText = decoder.decode(bytes);

    // Try to find document.xml content
    const textMatches = docxText.matchAll(/<w:t[^>]*>([^<]+)<\/w:t>/g);
    const parts: string[] = [];
    for (const match of textMatches) {
      parts.push(match[1]);
    }
    textContent = parts.join(' ');
  } else {
    // Plain text
    const decoder = new TextDecoder('utf-8');
    textContent = decoder.decode(bytes);
  }

  if (textContent.length < 50) {
    throw new Error('Could not extract text from file. Please try pasting the job description text directly.');
  }

  return structureWithOpenAI(textContent, 'document', openaiKey);
}

// Extract from plain text
async function extractFromText(text: string, openaiKey: string): Promise<JobDescription> {
  console.log('Processing plain text input');
  return structureWithOpenAI(text, 'job description text', openaiKey);
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

    const { source, url, fileBase64, fileName, text }: ExtractRequest = await req.json();

    let result: JobDescription;

    switch (source) {
      case 'url':
        if (!url) {
          return new Response(
            JSON.stringify({ error: 'URL is required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        result = await extractFromUrl(url, openaiKey);
        result.source = url;
        break;

      case 'file':
        if (!fileBase64 || !fileName) {
          return new Response(
            JSON.stringify({ error: 'File data and name are required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        result = await extractFromFile(fileBase64, fileName, openaiKey);
        result.source = fileName;
        break;

      case 'text':
        if (!text) {
          return new Response(
            JSON.stringify({ error: 'Text is required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        result = await extractFromText(text, openaiKey);
        result.source = 'manual_input';
        break;

      default:
        return new Response(
          JSON.stringify({ error: 'Invalid source type. Use url, file, or text.' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }

    return new Response(
      JSON.stringify(result),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Extract JD error:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Failed to extract job description',
        details: String(error)
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
