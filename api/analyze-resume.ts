import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

// Environment variables (check both standard and VITE_ prefixed versions)
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || process.env.VITE_OPENAI_API_KEY;

interface ResumeAnalysisRequest {
  filePath: string;
  fileName: string;
}

interface ResumeAnalysis {
  ats_score: number;
  strengths: string[];
  gaps: string[];
  recommendations: string[];
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
    console.log('=== VERCEL API: ANALYZE RESUME STARTED ===');

    // Validate environment variables
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !OPENAI_API_KEY) {
      console.error('Missing environment variables:', {
        hasSupabaseUrl: !!SUPABASE_URL,
        hasServiceRole: !!SUPABASE_SERVICE_ROLE_KEY,
        hasOpenAI: !!OPENAI_API_KEY,
      });
      return res.status(500).json({ error: 'Server configuration error. Please contact support.' });
    }

    // 1. Validate Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'Missing authorization header' });
    }

    if (!authHeader.startsWith('Bearer ')) {
      return res.status(400).json({ error: 'Invalid authorization header format' });
    }

    const token = authHeader.replace('Bearer ', '');

    // 2. Create Supabase client with service role
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
    console.log('Supabase client created');

    // 3. Validate JWT and get user
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      console.error('Auth error:', authError);
      return res.status(401).json({ error: 'Authentication required. Please sign in again.' });
    }
    console.log('User authenticated:', user.id);

    // 4. Parse request body
    const { filePath, fileName }: ResumeAnalysisRequest = req.body;

    if (!filePath || !fileName) {
      return res.status(400).json({ error: 'Invalid request. Please try uploading your resume again.' });
    }

    // 5. Validate storage path ownership
    console.log('Validating storage path:', filePath);

    const pathParts = filePath.split('/');
    if (pathParts.length < 2) {
      return res.status(400).json({ error: 'Invalid file path. Please upload your resume again.' });
    }

    const pathUserId = pathParts[0];
    if (pathUserId !== user.id) {
      console.error('Path ownership mismatch:', pathUserId, 'vs', user.id);
      return res.status(403).json({ error: 'You do not have permission to access this file.' });
    }

    if (!filePath.toLowerCase().endsWith('.pdf')) {
      return res.status(400).json({ error: 'Only PDF files are supported. Please upload a PDF resume.' });
    }

    console.log('Storage path validation passed');

    // 6. Atomic rate limit check
    console.log('Checking rate limit...');
    const currentMonth = new Date().toISOString().slice(0, 7);

    const { data: quotaResult, error: quotaError } = await supabase.rpc(
      'increment_usage_with_limit',
      {
        p_user_id: user.id,
        p_feature_type: 'resume_analysis',
        p_month: currentMonth,
        p_limit: 2,
      }
    );

    if (quotaError) {
      console.error('Quota check failed:', quotaError);
      return res.status(500).json({ error: 'Unable to verify usage limit. Please try again.' });
    }

    // quotaResult is an array since the function returns TABLE
    const quotaRow = Array.isArray(quotaResult) ? quotaResult[0] : quotaResult;
    console.log('Quota result:', quotaRow);

    if (!quotaRow || !quotaRow.success) {
      console.log('Rate limit exceeded. Quota row:', quotaRow);
      return res.status(429).json({ error: 'Rate limit exceeded. You have used all 2 analyses for this month.' });
    }

    const newUsageCount = quotaRow.usage_count;
    console.log('Rate limit passed. Current usage:', newUsageCount);

    // 7. Generate signed URL and download file
    console.log('Generating signed URL...');
    const { data: signedUrlData, error: signedUrlError } = await supabase.storage
      .from('resumes')
      .createSignedUrl(filePath, 300);

    if (signedUrlError || !signedUrlData) {
      console.error('Failed to generate signed URL:', signedUrlError);
      return res.status(404).json({ error: 'File not found. Please upload your resume again.' });
    }

    console.log('Downloading PDF...');
    const pdfResponse = await fetch(signedUrlData.signedUrl);

    if (!pdfResponse.ok) {
      console.error('PDF download failed:', pdfResponse.status, pdfResponse.statusText);
      return res.status(500).json({ error: 'Failed to download resume. Please try again.' });
    }

    // Validate Content-Type
    const contentType = pdfResponse.headers.get('Content-Type');
    if (!contentType || !contentType.includes('pdf')) {
      return res.status(400).json({ error: 'Invalid file type. Only PDF files are supported.' });
    }

    // Validate file size
    const contentLength = pdfResponse.headers.get('Content-Length');
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (contentLength && parseInt(contentLength) > maxSize) {
      return res.status(400).json({ error: 'File too large. Maximum size is 10MB.' });
    }

    const pdfArrayBuffer = await pdfResponse.arrayBuffer();
    const pdfBuffer = Buffer.from(pdfArrayBuffer);
    console.log('PDF downloaded, size:', pdfBuffer.length, 'bytes');

    if (pdfBuffer.length > maxSize) {
      return res.status(400).json({ error: 'File too large. Maximum size is 10MB.' });
    }

    // 8. Extract text using pdf2json (pure Node.js, no DOM dependencies)
    console.log('Extracting text with pdf2json...');
    let extractedText: string;

    try {
      extractedText = await extractTextWithPdf2json(pdfBuffer);
      console.log(`PDF parsed. Text length: ${extractedText.length}`);
    } catch (parseError) {
      console.error('PDF parsing failed:', parseError);

      // Fallback: try basic text extraction from PDF binary
      console.log('Trying fallback text extraction...');
      try {
        extractedText = extractTextFallback(pdfBuffer);
        console.log(`Fallback extraction got ${extractedText.length} characters`);
        if (extractedText.length < 100) {
          throw new Error('Insufficient text from fallback');
        }
      } catch (fallbackError) {
        console.error('Fallback extraction failed:', fallbackError);
        return res.status(400).json({
          error: 'Failed to read PDF content. This may be a scanned or encrypted PDF. Please try a different file.',
        });
      }
    }

    if (!extractedText || extractedText.length < 100) {
      console.error('Insufficient text extracted:', extractedText?.length || 0);
      return res.status(400).json({
        error: 'Unable to extract text from PDF. Please ensure your resume is not a scanned image.',
      });
    }

    console.log('Text extraction successful');

    // 9. Call OpenAI for analysis
    console.log('Calling OpenAI API...');
    const analysis = await analyzeResumeWithOpenAI(extractedText, OPENAI_API_KEY);
    console.log('OpenAI analysis completed. Score:', analysis.ats_score);

    // 10. Save to database
    const { data: analysisRecord, error: insertError } = await supabase
      .from('resume_analyses')
      .insert({
        user_id: user.id,
        file_name: fileName,
        file_url: filePath,
        ats_score: analysis.ats_score,
        strengths: analysis.strengths,
        gaps: analysis.gaps,
        recommendations: analysis.recommendations,
        analysis_date: new Date().toISOString(),
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error saving analysis:', insertError);
      return res.status(500).json({ error: 'Failed to save analysis results. Please try again.' });
    }

    const remainingAnalyses = Math.max(0, 2 - newUsageCount);
    console.log('Analysis saved. Remaining analyses:', remainingAnalyses);

    // 11. Return success response
    return res.status(200).json({
      success: true,
      analysis: analysisRecord,
      remainingAnalyses,
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    return res.status(500).json({ error: 'Resume analysis failed. Please try again.' });
  }
}

async function analyzeResumeWithOpenAI(resumeText: string, apiKey: string): Promise<ResumeAnalysis> {
  const prompt = `You are an expert ATS (Applicant Tracking System) analyzer and career coach. Analyze the following resume and provide:

1. An ATS score from 0-100 (how well the resume would perform in automated screening systems)
2. Top 3-5 strengths of the resume
3. Top 3-5 gaps or areas for improvement
4. Top 3-5 specific, actionable recommendations

Resume content:
${resumeText.slice(0, 6000)}

Respond ONLY with valid JSON in this exact format:
{
  "ats_score": <number between 0-100>,
  "strengths": ["strength 1", "strength 2", "strength 3"],
  "gaps": ["gap 1", "gap 2", "gap 3"],
  "recommendations": ["recommendation 1", "recommendation 2", "recommendation 3"]
}`;

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
          content: 'You are an expert ATS analyzer. Always respond with valid JSON only.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 1000,
    }),
  });

  if (!response.ok) {
    const errorData = await response.text();
    console.error('OpenAI API error:', response.status, errorData);
    throw new Error('AI analysis service is unavailable. Please try again later.');
  }

  const data = await response.json();
  const content = data.choices[0]?.message?.content;

  if (!content) {
    throw new Error('Analysis failed to generate results. Please try again.');
  }

  try {
    const analysis: ResumeAnalysis = JSON.parse(content);

    // Validate response structure
    if (
      typeof analysis.ats_score !== 'number' ||
      !Array.isArray(analysis.strengths) ||
      !Array.isArray(analysis.gaps) ||
      !Array.isArray(analysis.recommendations)
    ) {
      throw new Error('Invalid response structure');
    }

    // Ensure ATS score is within valid range
    analysis.ats_score = Math.max(0, Math.min(100, analysis.ats_score));

    return analysis;
  } catch (parseError) {
    console.error('Error parsing OpenAI response:', content);
    throw new Error('Analysis results could not be processed. Please try again.');
  }
}

// Extract text using pdf2json (pure Node.js, no DOM/canvas dependencies)
async function extractTextWithPdf2json(buffer: Buffer): Promise<string> {
  return new Promise((resolve, reject) => {
    // Dynamic import for ESM compatibility
    import('pdf2json').then((pdf2jsonModule) => {
      const PDFParser = pdf2jsonModule.default;
      const pdfParser = new PDFParser();

      pdfParser.on('pdfParser_dataError', (errData: { parserError: Error }) => {
        console.error('pdf2json error:', errData.parserError);
        reject(errData.parserError);
      });

      pdfParser.on('pdfParser_dataReady', (pdfData: { Pages: Array<{ Texts: Array<{ R: Array<{ T: string }> }> }> }) => {
        try {
          const textParts: string[] = [];

          // Iterate through pages and extract text
          for (const page of pdfData.Pages) {
            for (const textItem of page.Texts) {
              for (const run of textItem.R) {
                // Safely decode URI-encoded text
                let decodedText: string;
                try {
                  decodedText = decodeURIComponent(run.T);
                } catch {
                  // If URI decoding fails, use raw text or replace %XX patterns
                  decodedText = run.T.replace(/%([0-9A-Fa-f]{2})/g, (_, hex) => {
                    try {
                      return String.fromCharCode(parseInt(hex, 16));
                    } catch {
                      return '';
                    }
                  });
                }
                if (decodedText && decodedText.trim()) {
                  textParts.push(decodedText);
                }
              }
            }
            // Add page break
            textParts.push('\n');
          }

          const fullText = textParts.join(' ').replace(/\s+/g, ' ').trim();
          console.log(`pdf2json extracted ${fullText.length} characters from ${pdfData.Pages.length} pages`);
          resolve(fullText);
        } catch (err) {
          reject(err);
        }
      });

      // Parse the buffer
      pdfParser.parseBuffer(buffer);
    }).catch(reject);
  });
}

// Fallback text extraction using regex patterns on PDF binary
function extractTextFallback(buffer: Buffer): string {
  const text = buffer.toString('latin1');

  // Extract text from PDF stream objects
  const textParts: string[] = [];

  // Pattern 1: Text in parentheses (common PDF text encoding)
  const parenMatches = text.match(/\(([^)]{2,})\)/g) || [];
  for (const match of parenMatches) {
    const content = match.slice(1, -1);
    // Filter out binary/control characters
    if (/^[\x20-\x7E\s]+$/.test(content) && content.length > 2) {
      textParts.push(content);
    }
  }

  // Pattern 2: Text in angle brackets (hex encoded)
  const hexMatches = text.match(/<([0-9A-Fa-f\s]+)>/g) || [];
  for (const match of hexMatches) {
    const hex = match.slice(1, -1).replace(/\s/g, '');
    if (hex.length % 2 === 0 && hex.length > 4) {
      let decoded = '';
      for (let i = 0; i < hex.length; i += 2) {
        const charCode = parseInt(hex.substr(i, 2), 16);
        if (charCode >= 32 && charCode <= 126) {
          decoded += String.fromCharCode(charCode);
        }
      }
      if (decoded.length > 2) {
        textParts.push(decoded);
      }
    }
  }

  // Join and clean up
  let result = textParts.join(' ');
  result = result.replace(/\s+/g, ' ').trim();

  return result;
}
