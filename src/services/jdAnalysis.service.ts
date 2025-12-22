// JD Analysis Service
// Handles job description extraction and resume comparison analysis

import { supabase } from './supabase';
import type {
  JobDescription,
  ExtractJDRequest,
  AnalysisResult,
  ResumeJDAnalysis,
  SaveJobDescriptionInput,
  CreateAnalysisInput,
} from '../types/jdAnalysis.types';

/**
 * Extract job description from URL, file, or text
 */
export async function extractJobDescription(request: ExtractJDRequest): Promise<JobDescription> {
  const { data: { session } } = await supabase.auth.getSession();

  const response = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/extract-jd`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session?.access_token || ''}`,
      },
      body: JSON.stringify(request),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to extract job description');
  }

  return response.json();
}

/**
 * Analyze resume against job description
 */
export async function analyzeResumeVsJD(
  resumeText: string,
  jobDescription: JobDescription
): Promise<AnalysisResult> {
  const { data: { session } } = await supabase.auth.getSession();

  const response = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyze-resume-jd`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session?.access_token || ''}`,
      },
      body: JSON.stringify({
        resumeText,
        jobDescription,
      }),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to analyze resume');
  }

  return response.json();
}

/**
 * Save a job description for reuse
 */
export async function saveJobDescription(
  userId: string,
  input: SaveJobDescriptionInput
): Promise<JobDescription> {
  const { data, error } = await supabase
    .from('job_descriptions')
    // @ts-expect-error - Table not yet in generated types
    .insert({
      user_id: userId,
      title: input.title,
      company: input.company,
      location: input.location || '',
      description: input.description,
      requirements: input.requirements || [],
      skills: input.skills || [],
      experience_required: input.experience_required || '',
      source_url: input.source_url || null,
      source_type: input.source_type,
    })
    .select()
    .single();

  if (error) throw error;
  return data as JobDescription;
}

/**
 * Get user's saved job descriptions
 */
export async function getSavedJobDescriptions(userId: string): Promise<JobDescription[]> {
  const { data, error } = await supabase
    .from('job_descriptions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    if (error.code === '42P01') return [];
    throw error;
  }
  return (data || []) as JobDescription[];
}

/**
 * Get a single job description by ID
 */
export async function getJobDescriptionById(id: string): Promise<JobDescription | null> {
  const { data, error } = await supabase
    .from('job_descriptions')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }
  return data as JobDescription;
}

/**
 * Delete a job description
 */
export async function deleteJobDescription(id: string): Promise<void> {
  const { error } = await supabase
    .from('job_descriptions')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

/**
 * Save an analysis result to the database
 */
export async function saveAnalysisResult(
  userId: string,
  input: CreateAnalysisInput
): Promise<ResumeJDAnalysis> {
  const { data, error } = await supabase
    .from('resume_jd_analyses')
    // @ts-expect-error - Table not yet in generated types
    .insert({
      user_id: userId,
      job_description_id: input.job_description_id,
      resume_analysis_id: input.resume_analysis_id || null,
      resume_file_name: input.resume_file_name || null,
      resume_text: input.resume_text || null,
      match_score: input.match_score,
      keyword_analysis: input.keyword_analysis,
      section_analysis: input.section_analysis,
      improvements: input.improvements,
      tailored_summary: input.tailored_summary,
      action_items: input.action_items,
    })
    .select()
    .single();

  if (error) throw error;
  return data as ResumeJDAnalysis;
}

/**
 * Get user's analysis history
 */
export async function getAnalysisHistory(userId: string): Promise<ResumeJDAnalysis[]> {
  const { data, error } = await supabase
    .from('resume_jd_analyses')
    .select(`
      *,
      job_description:job_descriptions(*)
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    if (error.code === '42P01') return [];
    throw error;
  }
  return (data || []) as ResumeJDAnalysis[];
}

/**
 * Get a single analysis by ID
 */
export async function getAnalysisById(id: string): Promise<ResumeJDAnalysis | null> {
  const { data, error } = await supabase
    .from('resume_jd_analyses')
    .select(`
      *,
      job_description:job_descriptions(*)
    `)
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }
  return data as ResumeJDAnalysis;
}

/**
 * Delete an analysis record
 */
export async function deleteAnalysis(id: string): Promise<void> {
  const { error } = await supabase
    .from('resume_jd_analyses')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

/**
 * Get analyses for a specific job description
 */
export async function getAnalysesByJobDescription(
  userId: string,
  jobDescriptionId: string
): Promise<ResumeJDAnalysis[]> {
  const { data, error } = await supabase
    .from('resume_jd_analyses')
    .select('*')
    .eq('user_id', userId)
    .eq('job_description_id', jobDescriptionId)
    .order('created_at', { ascending: false });

  if (error) {
    if (error.code === '42P01') return [];
    throw error;
  }
  return (data || []) as ResumeJDAnalysis[];
}
