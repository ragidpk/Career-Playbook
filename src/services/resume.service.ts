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

  // Upload to storage bucket: resumes/{userId}/{timestamp}_{filename}
  const filePath = `${userId}/${Date.now()}_${file.name}`;
  if (isDevelopment) console.log('Uploading to path:', filePath);

  const { data, error } = await supabase.storage
    .from('resumes')
    .upload(filePath, file);

  if (error) {
    if (isDevelopment) console.error('Upload error:', error);
    throw error;
  }

  if (isDevelopment) console.log('Upload successful. Path:', data.path);

  // SECURITY: Return storage path, not signed URL
  // Edge Function will generate signed URL server-side
  return data.path;
}

export async function analyzeResume(filePath: string, fileName: string, targetCountry: string = 'United Arab Emirates') {
  // SECURITY: Only log in development to avoid PII leakage
  if (isDevelopment) {
    console.log('=== ANALYZE RESUME SERVICE CALLED ===');
    console.log('File Path:', filePath);
    console.log('File Name:', fileName);
    console.log('Target Country:', targetCountry);
  }

  // Get the current session token for authentication
  const { data: { session } } = await supabase.auth.getSession();

  if (!session?.access_token) {
    throw new Error('Authentication required. Please sign in.');
  }

  // Call Vercel API route instead of Supabase Edge Function
  // This uses Node.js runtime where pdf-parse works natively
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

  // SECURITY: file_url now contains storage paths (not signed URLs)
  // Generate signed URLs on-demand when needed for download/preview
  return data;
}

/**
 * Generate a signed URL for downloading/viewing a resume from history
 * @param filePath Storage path (e.g., "userId/timestamp_filename.pdf")
 * @param expiresIn Expiry time in seconds (default: 1 hour)
 * @returns Signed URL for temporary access
 */
export async function getResumeDownloadUrl(filePath: string, expiresIn: number = 3600): Promise<string> {
  if (isDevelopment) {
    console.log('Generating signed URL for path:', filePath);
  }

  const { data, error } = await supabase.storage
    .from('resumes')
    .createSignedUrl(filePath, expiresIn);

  if (error) {
    if (isDevelopment) console.error('Failed to generate signed URL:', error);
    throw new Error('Failed to generate download link');
  }

  if (!data?.signedUrl) {
    throw new Error('No signed URL returned');
  }

  return data.signedUrl;
}

export async function checkUsageLimit(userId: string) {
  const currentMonth = new Date().toISOString().slice(0, 7); // Format: YYYY-MM
  const { data } = await supabase
    .from('ai_usage_tracking')
    .select('usage_count')
    .eq('user_id', userId)
    .eq('feature_type', 'resume_analysis')
    .eq('usage_month', currentMonth)
    .maybeSingle();

  const usageCount = (data as AIUsageRow | null)?.usage_count || 0;
  const remaining = 2 - usageCount;

  return {
    remaining: Math.max(0, remaining),
    limit: 2,
    usageCount
  };
}

/**
 * Delete a resume analysis record
 * Also deletes the associated file from storage
 * @param analysisId The ID of the analysis to delete
 * @param filePath The storage path of the resume file
 */
export async function deleteAnalysis(analysisId: string, filePath: string): Promise<void> {
  if (isDevelopment) {
    console.log('Deleting analysis:', analysisId, 'and file:', filePath);
  }

  // Delete the file from storage first
  if (filePath) {
    const { error: storageError } = await supabase.storage
      .from('resumes')
      .remove([filePath]);

    if (storageError) {
      console.error('Failed to delete file from storage:', storageError);
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
