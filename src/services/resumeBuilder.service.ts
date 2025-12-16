import { supabase } from './supabase';
import type {
  UserResume,
  CreateResumeInput,
  UpdateResumeInput,
  AIImprovementRequest,
  AIImprovementResponse,
} from '../types/resumeBuilder.types';

const isDevelopment = import.meta.env.DEV;

/**
 * Get all resumes for a user
 */
export async function getUserResumes(userId: string): Promise<UserResume[]> {
  if (isDevelopment) {
    console.log('Fetching resumes for user:', userId);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('user_resumes')
    .select('*')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false });

  if (error) {
    if (isDevelopment) console.error('Error fetching resumes:', error);
    throw new Error('Failed to fetch resumes');
  }

  return data || [];
}

/**
 * Get a single resume by ID
 */
export async function getResumeById(resumeId: string): Promise<UserResume | null> {
  if (isDevelopment) {
    console.log('Fetching resume:', resumeId);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('user_resumes')
    .select('*')
    .eq('id', resumeId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null; // Not found
    }
    if (isDevelopment) console.error('Error fetching resume:', error);
    throw new Error('Failed to fetch resume');
  }

  return data;
}

/**
 * Create a new resume
 */
export async function createResume(
  userId: string,
  input: CreateResumeInput = {}
): Promise<UserResume> {
  if (isDevelopment) {
    console.log('Creating resume for user:', userId);
  }

  const resumeData = {
    user_id: userId,
    name: input.name || 'Untitled Resume',
    is_primary: input.is_primary || false,
    selected_template: input.selected_template || 'modern',
    personal_info: input.personal_info || {},
    professional_summary: input.professional_summary || '',
    work_experience: input.work_experience || [],
    education: input.education || [],
    skills: input.skills || [],
    certifications: input.certifications || [],
    projects: input.projects || [],
    section_order: input.section_order || [
      'personal_info',
      'professional_summary',
      'work_experience',
      'education',
      'skills',
      'certifications',
      'projects',
    ],
    imported_from: input.imported_from || null,
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('user_resumes')
    .insert(resumeData)
    .select()
    .single();

  if (error) {
    if (isDevelopment) console.error('Error creating resume:', error);
    throw new Error('Failed to create resume');
  }

  if (isDevelopment) console.log('Resume created:', data.id);
  return data;
}

/**
 * Update an existing resume
 */
export async function updateResume(input: UpdateResumeInput): Promise<UserResume> {
  const { id, ...updateData } = input;

  if (isDevelopment) {
    console.log('Updating resume:', id);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('user_resumes')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    if (isDevelopment) console.error('Error updating resume:', error);
    throw new Error('Failed to update resume');
  }

  if (isDevelopment) console.log('Resume updated:', data.id);
  return data;
}

/**
 * Delete a resume
 */
export async function deleteResume(resumeId: string): Promise<void> {
  if (isDevelopment) {
    console.log('Deleting resume:', resumeId);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('user_resumes')
    .delete()
    .eq('id', resumeId);

  if (error) {
    if (isDevelopment) console.error('Error deleting resume:', error);
    throw new Error('Failed to delete resume');
  }

  if (isDevelopment) console.log('Resume deleted');
}

/**
 * Duplicate a resume
 */
export async function duplicateResume(
  resumeId: string,
  userId: string
): Promise<UserResume> {
  const original = await getResumeById(resumeId);
  if (!original) {
    throw new Error('Resume not found');
  }

  return createResume(userId, {
    name: `${original.name} (Copy)`,
    is_primary: false,
    selected_template: original.selected_template,
    personal_info: original.personal_info,
    professional_summary: original.professional_summary || undefined,
    work_experience: original.work_experience,
    education: original.education,
    skills: original.skills,
    certifications: original.certifications,
    projects: original.projects,
    section_order: original.section_order,
  });
}

/**
 * Set a resume as primary (unsets others)
 */
export async function setPrimaryResume(
  resumeId: string,
  userId: string
): Promise<void> {
  if (isDevelopment) {
    console.log('Setting primary resume:', resumeId);
  }

  // The database trigger handles unsetting other primary resumes
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('user_resumes')
    .update({ is_primary: true })
    .eq('id', resumeId)
    .eq('user_id', userId);

  if (error) {
    if (isDevelopment) console.error('Error setting primary:', error);
    throw new Error('Failed to set primary resume');
  }
}

/**
 * Improve resume content using AI
 */
export async function improveResumeContent(
  request: AIImprovementRequest
): Promise<AIImprovementResponse> {
  if (isDevelopment) {
    console.log('Improving resume content:', request.type);
  }

  const { data: { session } } = await supabase.auth.getSession();

  if (!session?.access_token) {
    throw new Error('Authentication required');
  }

  const response = await fetch('/api/improve-resume-section', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`,
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.error || 'Failed to improve content');
  }

  return response.json();
}

/**
 * Parse an uploaded PDF to extract resume data
 */
export async function parseResumePdf(file: File): Promise<Partial<UserResume>> {
  if (isDevelopment) {
    console.log('Parsing resume PDF:', file.name);
  }

  const { data: { session } } = await supabase.auth.getSession();

  if (!session?.access_token) {
    throw new Error('Authentication required');
  }

  // Convert file to base64
  const buffer = await file.arrayBuffer();
  const base64 = btoa(
    new Uint8Array(buffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
  );

  const response = await fetch('/api/parse-resume-pdf', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({
      fileData: base64,
      fileName: file.name,
    }),
  });

  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.error || 'Failed to parse resume');
  }

  return response.json();
}
