import { PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { s3Client, RESUMES_BUCKET } from '../lib/s3';
import { supabase } from './supabase';
import type { Database } from '../types/database.types';

type AIUsageRow = Database['public']['Tables']['ai_usage_tracking']['Row'];

const isDevelopment = import.meta.env.DEV;

export async function uploadResume(file: File, userId: string): Promise<string> {
  // SECURITY: Only log in development to avoid PII leakage
  if (isDevelopment) {
    console.log('=== UPLOAD RESUME CALLED ===');
    console.log('File name:', file.name);
    console.log('File type:', file.type);
    console.log('File size:', file.size, 'bytes');
    console.log('User ID:', userId);
  }

  // Validate file type
  if (file.type !== 'application/pdf') {
    if (isDevelopment) console.error('Invalid file type:', file.type);
    throw new Error('Only PDF files are allowed');
  }

  // Validate file size (10MB max)
  const maxSize = 10 * 1024 * 1024; // 10MB
  if (file.size > maxSize) {
    if (isDevelopment) console.error('File too large:', file.size);
    throw new Error('File size must be less than 10MB');
  }

  // Generate S3 key: {userId}/{timestamp}_{filename}
  const key = `${userId}/${Date.now()}_${file.name}`;
  if (isDevelopment) console.log('Uploading to S3 key:', key);

  // Convert File to ArrayBuffer
  const arrayBuffer = await file.arrayBuffer();

  // Upload to S3
  const command = new PutObjectCommand({
    Bucket: RESUMES_BUCKET,
    Key: key,
    Body: new Uint8Array(arrayBuffer),
    ContentType: 'application/pdf',
  });

  try {
    await s3Client.send(command);
    if (isDevelopment) console.log('Upload successful. Key:', key);
    return key; // Return S3 key for backend processing
  } catch (error) {
    if (isDevelopment) console.error('Upload error:', error);
    throw error;
  }
}

export async function analyzeResume(filePath: string, fileName: string, targetCountry: string = 'United Arab Emirates') {
  // SECURITY: Only log in development to avoid PII leakage
  if (isDevelopment) {
    console.log('=== ANALYZE RESUME SERVICE CALLED ===');
    console.log('File Path (S3 Key):', filePath);
    console.log('File Name:', fileName);
    console.log('Target Country:', targetCountry);
  }

  // Get the current session token for authentication
  const { data: { session } } = await supabase.auth.getSession();

  if (!session?.access_token) {
    throw new Error('Authentication required. Please sign in.');
  }

  // Call Vercel API route
  const response = await fetch('/api/analyze-resume', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({ filePath, fileName, targetCountry }),
  });

  const data = await response.json();

  if (isDevelopment) {
    console.log('Vercel API Response:', { status: response.status, data });
  }

  if (!response.ok) {
    if (isDevelopment) {
      console.error('Vercel API Error:', response.status, data);
    }
    throw new Error(data.error || 'Resume analysis failed');
  }

  if (data?.error) {
    if (isDevelopment) console.error('Data contains error:', data.error);
    throw new Error(data.error);
  }

  if (isDevelopment) console.log('Analysis successful');
  return data;
}

export async function getAnalysisHistory(userId: string) {
  const { data, error } = await supabase
    .from('resume_analyses')
    .select('*')
    .eq('user_id', userId)
    .order('analysis_date', { ascending: false });

  if (error) throw error;

  // SECURITY: file_url contains S3 keys (not signed URLs)
  // Generate signed URLs on-demand when needed for download/preview
  return data;
}

/**
 * Generate a signed URL for downloading/viewing a resume from history
 * @param filePath S3 key (e.g., "userId/timestamp_filename.pdf")
 * @param expiresIn Expiry time in seconds (default: 1 hour)
 * @returns Signed URL for temporary access
 */
export async function getResumeDownloadUrl(filePath: string, expiresIn: number = 3600): Promise<string> {
  if (isDevelopment) {
    console.log('Generating signed URL for S3 key:', filePath);
  }

  const command = new GetObjectCommand({
    Bucket: RESUMES_BUCKET,
    Key: filePath,
  });

  try {
    const signedUrl = await getSignedUrl(s3Client, command, { expiresIn });
    return signedUrl;
  } catch (error) {
    if (isDevelopment) console.error('Failed to generate signed URL:', error);
    throw new Error('Failed to generate download link');
  }
}

export async function checkUsageLimit(userId: string) {
  const currentMonth = new Date().toISOString().slice(0, 7); // Format: YYYY-MM
  const DEFAULT_LIMIT = 2;

  // Fetch user's custom limit from profile and current usage in parallel
  const [profileResult, usageResult] = await Promise.all([
    supabase
      .from('profiles')
      .select('resume_analysis_limit')
      .eq('id', userId)
      .maybeSingle(),
    supabase
      .from('ai_usage_tracking')
      .select('usage_count')
      .eq('user_id', userId)
      .eq('feature_type', 'resume_analysis')
      .eq('usage_month', currentMonth)
      .maybeSingle()
  ]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const userLimit = (profileResult.data as any)?.resume_analysis_limit ?? DEFAULT_LIMIT;
  const usageCount = (usageResult.data as AIUsageRow | null)?.usage_count || 0;
  const remaining = userLimit - usageCount;

  return {
    remaining: Math.max(0, remaining),
    limit: userLimit,
    usageCount
  };
}

/**
 * Delete a resume analysis record
 * Also deletes the associated file from S3 storage
 * @param analysisId The ID of the analysis to delete
 * @param filePath The S3 key of the resume file
 */
export async function deleteAnalysis(analysisId: string, filePath: string): Promise<void> {
  if (isDevelopment) {
    console.log('Deleting analysis:', analysisId, 'and S3 key:', filePath);
  }

  // Delete the file from S3 first
  if (filePath) {
    try {
      const command = new DeleteObjectCommand({
        Bucket: RESUMES_BUCKET,
        Key: filePath,
      });
      await s3Client.send(command);
    } catch (error) {
      console.error('Failed to delete file from S3:', error);
      // Continue anyway - we still want to delete the DB record
    }
  }

  // Delete the analysis record from database
  const { error: dbError } = await supabase
    .from('resume_analyses')
    .delete()
    .eq('id', analysisId);

  if (dbError) {
    throw new Error('Failed to delete analysis record');
  }

  if (isDevelopment) {
    console.log('Analysis deleted successfully');
  }
}
