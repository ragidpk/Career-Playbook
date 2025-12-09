import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
// @deno-types="npm:@types/pdfjs-dist"
import * as pdfjsLib from 'npm:pdfjs-dist@4.0.379/legacy/build/pdf.mjs';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ResumeAnalysisRequest {
  filePath: string;  // Storage path: userId/timestamp_filename.pdf
  fileName: string;  // Original filename for display
}

interface ResumeAnalysis {
  ats_score: number;
  strengths: string[];
  gaps: string[];
  recommendations: string[];
}

// SECURITY: Standardized error responses to avoid leaking internals
class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public userMessage: string = 'An error occurred during resume analysis. Please try again or contact support.'
  ) {
    super(message);
    this.name = 'AppError';
  }
}

function handleError(error: unknown): Response {
  // Log full error details server-side
  console.error('Error in analyze-resume function:', error);
  if (error instanceof Error) {
    console.error('Error stack:', error.stack);
    console.error('Error type:', error.constructor.name);
    console.error('Error message:', error.message);
  }

  // Determine status code and user message
  let statusCode = 500;
  let userMessage = 'Resume analysis failed. Please try again or contact support.';

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
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log('=== ANALYZE RESUME STARTED ===');

    // SECURITY: Validate Authorization header presence and format
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    if (!authHeader.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Invalid authorization header format' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Create Supabase client with service role for DB operations
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );
    console.log('Supabase client created');

    // Get user from JWT
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);

    if (userError || !user) {
      console.error('Auth error:', userError);
      throw new AppError(
        'Auth failed: ' + (userError?.message || 'No user found'),
        401,
        'Authentication required. Please sign in again.'
      );
    }
    console.log('User authenticated:', user.id);

    // Parse request body
    const { filePath, fileName }: ResumeAnalysisRequest = await req.json();

    if (!filePath || !fileName) {
      throw new AppError(
        'Missing fields: filePath or fileName',
        400,
        'Invalid request. Please try uploading your resume again.'
      );
    }

    // SECURITY: Validate storage path ownership
    console.log('Validating storage path:', filePath);

    // Validate path format: userId/timestamp_filename.pdf
    const pathParts = filePath.split('/');
    if (pathParts.length < 2) {
      throw new AppError(
        'Invalid path format: ' + filePath,
        400,
        'Invalid file path. Please upload your resume again.'
      );
    }

    // Validate path starts with authenticated user ID
    const pathUserId = pathParts[0];
    if (pathUserId !== user.id) {
      throw new AppError(
        'Path ownership mismatch: ' + pathUserId + ' vs ' + user.id,
        403,
        'You do not have permission to access this file.'
      );
    }

    // Validate file extension
    if (!filePath.toLowerCase().endsWith('.pdf')) {
      throw new AppError(
        'Invalid file extension: ' + filePath,
        400,
        'Only PDF files are supported. Please upload a PDF resume.'
      );
    }

    console.log('Storage path validation passed');

    // SECURITY: Atomic rate limit check using database function
    console.log('Checking rate limit atomically...');
    const currentMonth = new Date().toISOString().slice(0, 7);

    const { data: quotaResult, error: quotaError } = await supabaseClient.rpc(
      'increment_usage_with_limit',
      {
        p_user_id: user.id,
        p_feature_type: 'resume_analysis',
        p_month: currentMonth,
        p_limit: 2
      }
    );

    if (quotaError) {
      console.error('Quota check failed:', quotaError);
      throw new AppError(
        'Quota RPC error: ' + quotaError.message,
        500,
        'Unable to verify usage limit. Please try again or contact support.'
      );
    }

    if (!quotaResult.success) {
      throw new AppError(
        'Rate limit exceeded for user ' + user.id,
        429,
        'Rate limit exceeded. You have used all 2 analyses for this month.'
      );
    }

    const newUsageCount = quotaResult.usage_count;
    console.log('Rate limit passed. Current usage:', newUsageCount);

    // SECURITY: Generate signed URL server-side using storage client
    console.log('Generating signed URL for storage path...');
    const { data: signedUrlData, error: signedUrlError } = await supabaseClient.storage
      .from('resumes')
      .createSignedUrl(filePath, 300); // 5 minute expiry, only for internal use

    if (signedUrlError || !signedUrlData) {
      console.error('Failed to generate signed URL:', signedUrlError);
      throw new AppError(
        'Signed URL error: ' + signedUrlError?.message,
        404,
        'File not found. Please upload your resume again.'
      );
    }

    const signedUrl = signedUrlData.signedUrl;
    console.log('Signed URL generated successfully');

    // Download PDF from storage using signed URL
    console.log('Downloading PDF...');
    const pdfResponse = await fetch(signedUrl);
    console.log('PDF response status:', pdfResponse.status, pdfResponse.statusText);
    if (!pdfResponse.ok) {
      throw new AppError(
        `PDF download failed: ${pdfResponse.status} ${pdfResponse.statusText}`,
        500,
        'Failed to download resume. Please try again.'
      );
    }

    // SECURITY: Validate Content-Type
    const contentType = pdfResponse.headers.get('Content-Type');
    if (!contentType || !contentType.includes('pdf')) {
      throw new AppError(
        'Invalid Content-Type: ' + contentType,
        400,
        'Invalid file type. Only PDF files are supported.'
      );
    }

    // SECURITY: Validate file size before parsing
    const contentLength = pdfResponse.headers.get('Content-Length');
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (contentLength && parseInt(contentLength) > maxSize) {
      throw new AppError(
        'File too large: ' + contentLength + ' bytes',
        400,
        'File too large. Maximum size is 10MB.'
      );
    }

    const pdfBuffer = await pdfResponse.arrayBuffer();
    console.log('PDF downloaded, size:', pdfBuffer.byteLength, 'bytes');

    // Double-check actual buffer size
    if (pdfBuffer.byteLength > maxSize) {
      throw new AppError(
        'Buffer too large: ' + pdfBuffer.byteLength + ' bytes',
        400,
        'File too large. Maximum size is 10MB.'
      );
    }

    // Extract text from PDF using a simple approach
    // Note: For production, you'd want to use a proper PDF parsing library
    // For now, we'll use a placeholder extraction
    console.log('Extracting text from PDF...');
    const pdfText = await extractTextFromPDF(pdfBuffer);
    console.log('Extracted text length:', pdfText?.length || 0, 'characters');

    if (!pdfText || pdfText.length < 100) {
      console.error('Insufficient text extracted. Length:', pdfText?.length);
      throw new AppError(
        'Insufficient text: ' + (pdfText?.length || 0) + ' chars',
        400,
        'Unable to extract text from PDF. Please ensure your resume is not a scanned image.'
      );
    }
    console.log('Text extraction successful');

    // Call OpenAI API for analysis
    console.log('Getting OpenAI API key...');
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiApiKey) {
      throw new AppError(
        'OpenAI API key not configured',
        500,
        'Analysis service is not configured. Please contact support.'
      );
    }
    // SECURITY: Don't log secrets
    console.log('OpenAI API key found');

    console.log('Calling OpenAI API...');
    const analysis = await analyzeResumeWithOpenAI(pdfText, openaiApiKey);
    console.log('OpenAI analysis completed. Score:', analysis.ats_score);

    // Save analysis to database (store path, not signed URL)
    const { data: analysisRecord, error: insertError } = await supabaseClient
      .from('resume_analyses')
      .insert({
        user_id: user.id,
        file_name: fileName,
        file_url: filePath,  // Store storage path, not signed URL
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
      throw new AppError(
        'Database insert error: ' + insertError.message,
        500,
        'Failed to save analysis results. Please try again.'
      );
    }

    // Calculate remaining analyses from the updated usage count
    const remainingAnalyses = Math.max(0, 2 - newUsageCount);
    console.log('Analysis saved successfully. Remaining analyses:', remainingAnalyses);

    // Return analysis results
    return new Response(
      JSON.stringify({
        success: true,
        analysis: analysisRecord,
        remainingAnalyses,
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

async function extractTextFromPDF(buffer: ArrayBuffer): Promise<string> {
  try {
    console.log('Loading PDF document...');

    // Convert ArrayBuffer to Uint8Array for pdfjs
    const uint8Array = new Uint8Array(buffer);

    // Load the PDF document
    const loadingTask = pdfjsLib.getDocument({ data: uint8Array });
    const pdf = await loadingTask.promise;

    console.log(`PDF loaded. Total pages: ${pdf.numPages}`);

    // Extract text from all pages
    const textParts: string[] = [];

    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      console.log(`Extracting text from page ${pageNum}...`);
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();

      // Concatenate all text items
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(' ');

      textParts.push(pageText);
    }

    const fullText = textParts.join('\n\n');
    console.log(`Total extracted text length: ${fullText.length} characters`);

    if (!fullText || fullText.trim().length < 100) {
      throw new AppError(
        'Insufficient PDF text: ' + fullText.trim().length + ' chars',
        400,
        'PDF does not contain enough text. Please ensure it is not a scanned image.'
      );
    }

    return fullText;
  } catch (error) {
    console.error('Error extracting text from PDF:', error);
    if (error instanceof Error) {
      console.error('Error type:', error.constructor.name);
      console.error('Error message:', error.message);
    }
    if (error instanceof AppError) throw error;
    throw new AppError(
      `PDF extraction failed: ${error instanceof Error ? error.message : 'unknown'}`,
      500,
      'Failed to read PDF content. Please try again with a different file.'
    );
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
    throw new AppError(
      `OpenAI API error: ${response.status}`,
      500,
      'AI analysis service is unavailable. Please try again later.'
    );
  }

  const data = await response.json();
  const content = data.choices[0]?.message?.content;

  if (!content) {
    throw new AppError(
      'No response from OpenAI',
      500,
      'Analysis failed to generate results. Please try again.'
    );
  }

  try {
    // Parse JSON response
    const analysis: ResumeAnalysis = JSON.parse(content);

    // Validate the response structure
    if (
      typeof analysis.ats_score !== 'number' ||
      !Array.isArray(analysis.strengths) ||
      !Array.isArray(analysis.gaps) ||
      !Array.isArray(analysis.recommendations)
    ) {
      throw new AppError(
        'Invalid OpenAI response structure',
        500,
        'Analysis generated invalid results. Please try again.'
      );
    }

    // Ensure ATS score is within valid range
    analysis.ats_score = Math.max(0, Math.min(100, analysis.ats_score));

    return analysis;
  } catch (parseError) {
    console.error('Error parsing OpenAI response:', content);
    if (parseError instanceof AppError) throw parseError;
    throw new AppError(
      'Failed to parse OpenAI response',
      500,
      'Analysis results could not be processed. Please try again.'
    );
  }
}
