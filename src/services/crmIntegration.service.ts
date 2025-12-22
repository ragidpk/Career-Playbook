// CRM Integration Service
// Handles tracking external jobs in the CRM system

import { supabase } from './supabase';
import { ensureJobInDatabase } from './externalJob.service';
import type { ExternalJob } from '../types/externalJobs.types';

// CRM Types
export type ApplicationStatus =
  | 'wishlist'
  | 'applied'
  | 'screening'
  | 'phone_interview'
  | 'technical_interview'
  | 'onsite_interview'
  | 'final_round'
  | 'offer_received'
  | 'negotiating'
  | 'accepted'
  | 'rejected'
  | 'withdrawn';

export type PriorityLevel = 'high' | 'medium' | 'low';
export type LocationType = 'remote' | 'hybrid' | 'onsite';

export interface CrmCompany {
  id: string;
  user_id: string;
  name: string;
  industry: string | null;
  location: string | null;
  website: string | null;
  linkedin_url: string | null;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
}

export interface CrmApplication {
  id: string;
  user_id: string;
  company_id: string;
  external_job_id: string | null;
  job_title: string;
  job_url: string | null;
  job_description: string | null;
  salary_min: number | null;
  salary_max: number | null;
  salary_currency: string;
  location_type: LocationType | null;
  work_location: string | null;
  application_date: string | null;
  source: string | null;
  status: ApplicationStatus;
  priority: PriorityLevel;
  notes: string | null;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
}

export interface TrackJobInput {
  externalJobId: string;
  // Optional: pass job data directly (for jobs not yet in external_jobs table)
  jobData?: {
    title: string;
    company_name: string;
    location?: string | null;
    location_type?: 'remote' | 'hybrid' | 'onsite' | null;
    description_snippet?: string | null;
    canonical_url?: string | null;
    apply_url?: string | null;
    salary_min?: number | null;
    salary_max?: number | null;
    salary_currency?: string;
    provider?: string;
  };
  initialStatus?: ApplicationStatus;
  priority?: PriorityLevel;
  notes?: string;
}

export interface TrackJobResult {
  application: CrmApplication;
  company: CrmCompany;
  isNewCompany: boolean;
}

/**
 * Find an existing CRM company by name for a user
 */
export async function findCompanyByName(
  userId: string,
  companyName: string
): Promise<CrmCompany | null> {
  // Normalize company name for comparison
  const normalizedName = companyName.trim().toLowerCase();

  const { data, error } = await supabase
    .from('crm_companies')
    .select('*')
    .eq('user_id', userId)
    .eq('is_archived', false);

  if (error) {
    if (error.code === '42P01') return null; // Table doesn't exist
    throw error;
  }

  // Case-insensitive match
  const match = data?.find(
    (c: CrmCompany) => c.name.trim().toLowerCase() === normalizedName
  );
  return match || null;
}

/**
 * Create a new CRM company from external job data
 */
export async function createCompanyFromJob(
  userId: string,
  job: ExternalJob
): Promise<CrmCompany> {
  const { data, error } = await supabase
    .from('crm_companies')
    // @ts-expect-error - Table columns not yet in generated types
    .insert({
      user_id: userId,
      name: job.company_name,
      location: job.location || null,
    })
    .select()
    .single();

  if (error) throw error;
  return data as CrmCompany;
}

/**
 * Find or create a CRM company for the given external job
 */
export async function findOrCreateCompany(
  userId: string,
  job: ExternalJob
): Promise<{ company: CrmCompany; isNew: boolean }> {
  // Try to find existing company
  const existing = await findCompanyByName(userId, job.company_name);
  if (existing) {
    return { company: existing, isNew: false };
  }

  // Create new company
  const newCompany = await createCompanyFromJob(userId, job);
  return { company: newCompany, isNew: true };
}

/**
 * Check if a job is already tracked in CRM
 */
export async function getApplicationByExternalJob(
  userId: string,
  externalJobId: string
): Promise<CrmApplication | null> {
  const { data, error } = await supabase
    .from('crm_applications')
    .select('*')
    .eq('user_id', userId)
    .eq('external_job_id', externalJobId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; // Not found
    if (error.code === '42P01') return null; // Table doesn't exist
    throw error;
  }
  return data;
}

/**
 * Get external job by ID
 */
async function getExternalJob(jobId: string): Promise<ExternalJob | null> {
  const { data, error } = await supabase
    .from('external_jobs')
    .select('*')
    .eq('id', jobId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }
  return data;
}

/**
 * Create a CRM application from an external job
 */
export async function createApplicationFromJob(
  userId: string,
  companyId: string,
  job: ExternalJob,
  options?: {
    initialStatus?: ApplicationStatus;
    priority?: PriorityLevel;
    notes?: string;
  }
): Promise<CrmApplication> {
  const { data, error } = await supabase
    .from('crm_applications')
    // @ts-expect-error - Table columns not yet in generated types
    .insert({
      user_id: userId,
      company_id: companyId,
      external_job_id: job.id,
      job_title: job.title,
      job_url: job.canonical_url || job.apply_url,
      job_description: job.description_snippet,
      salary_min: job.salary_min,
      salary_max: job.salary_max,
      salary_currency: job.salary_currency || 'USD',
      location_type: job.location_type,
      work_location: job.location,
      source: job.provider,
      status: options?.initialStatus || 'wishlist',
      priority: options?.priority || 'medium',
      notes: options?.notes || null,
    })
    .select()
    .single();

  if (error) throw error;
  return data as CrmApplication;
}

/**
 * Track an external job in CRM
 * This is the main entry point for the "Track in CRM" flow
 *
 * 1. Gets job data (from DB or input.jobData)
 * 2. Finds or creates the CRM company
 * 3. Creates the CRM application with external_job_id
 * 4. Also creates entry in legacy 'companies' table for CRM page display
 * 5. Returns the new application record
 */
export async function trackJobInCrm(
  userId: string,
  input: TrackJobInput
): Promise<TrackJobResult> {
  // Check if already tracked
  const existing = await getApplicationByExternalJob(userId, input.externalJobId);
  if (existing) {
    throw new Error('This job is already tracked in your CRM');
  }

  // Get job data - either from input or fetch from database
  let job: ExternalJob;

  if (input.jobData) {
    // Use provided job data (for jobs from search that aren't in DB yet)
    job = {
      id: input.externalJobId,
      provider: (input.jobData.provider as ExternalJob['provider']) || 'legacy',
      provider_job_id: input.externalJobId,
      canonical_url: input.jobData.canonical_url || null,
      title: input.jobData.title,
      company_name: input.jobData.company_name,
      location: input.jobData.location || null,
      location_type: input.jobData.location_type || null,
      description_snippet: input.jobData.description_snippet || null,
      posted_at: null,
      apply_url: input.jobData.apply_url || null,
      salary_min: input.jobData.salary_min || null,
      salary_max: input.jobData.salary_max || null,
      salary_currency: input.jobData.salary_currency || 'USD',
      raw: null,
      ingested_at: new Date().toISOString(),
    };
    // Ensure the job exists in external_jobs table (for foreign key constraint)
    await ensureJobInDatabase(job);
  } else {
    // Fetch from database
    const dbJob = await getExternalJob(input.externalJobId);
    if (!dbJob) {
      throw new Error('Job not found. Please try tracking again.');
    }
    job = dbJob;
  }

  // Find or create company
  const { company, isNew: isNewCompany } = await findOrCreateCompany(userId, job);

  // Create application
  const application = await createApplicationFromJob(userId, company.id, job, {
    initialStatus: input.initialStatus,
    priority: input.priority,
    notes: input.notes,
  });

  // Also insert into legacy 'companies' table for CRM page display
  const { error: legacyError } = await supabase
    .from('companies')
    // @ts-expect-error - Legacy table schema not in generated types
    .insert({
      user_id: userId,
      name: job.company_name,
      job_title: job.title,
      job_posting_url: job.canonical_url || job.apply_url,
      location: job.location,
      salary_range: job.salary_min && job.salary_max
        ? `${job.salary_min}-${job.salary_max} ${job.salary_currency || 'USD'}`
        : job.salary_min
          ? `From ${job.salary_min} ${job.salary_currency || 'USD'}`
          : null,
      status: 'researching',
      notes: job.description_snippet,
      referral_source: job.provider === 'manual_url' ? 'Manual Import' : job.provider,
      priority: input.priority === 'high' ? 3 : input.priority === 'low' ? 1 : 2,
    });

  if (legacyError) {
    // Don't fail if legacy insert fails, the main tracking succeeded
    console.error('Failed to insert into legacy companies table:', legacyError);
  }

  return {
    application,
    company,
    isNewCompany,
  };
}

/**
 * Get CRM application with company details
 */
export async function getApplicationWithCompany(applicationId: string): Promise<{
  application: CrmApplication;
  company: CrmCompany;
} | null> {
  const { data, error } = await supabase
    .from('crm_applications')
    .select(`
      *,
      company:crm_companies(*)
    `)
    .eq('id', applicationId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }

  const typedData = data as CrmApplication & { company: CrmCompany };
  return {
    application: typedData,
    company: typedData.company,
  };
}

/**
 * Update a CRM application's status
 */
export async function updateApplicationStatus(
  applicationId: string,
  status: ApplicationStatus
): Promise<CrmApplication> {
  const { data, error } = await supabase
    .from('crm_applications')
    // @ts-expect-error - Table columns not yet in generated types
    .update({
      status,
      updated_at: new Date().toISOString(),
    })
    .eq('id', applicationId)
    .select()
    .single();

  if (error) throw error;
  return data as CrmApplication;
}

/**
 * Get all CRM applications for a user
 */
export async function getUserApplications(
  userId: string,
  filters?: {
    status?: ApplicationStatus[];
    priority?: PriorityLevel[];
    includeArchived?: boolean;
  }
): Promise<CrmApplication[]> {
  let query = supabase
    .from('crm_applications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (!filters?.includeArchived) {
    query = query.eq('is_archived', false);
  }

  if (filters?.status && filters.status.length > 0) {
    query = query.in('status', filters.status);
  }

  if (filters?.priority && filters.priority.length > 0) {
    query = query.in('priority', filters.priority);
  }

  const { data, error } = await query;

  if (error) {
    if (error.code === '42P01') return []; // Table doesn't exist
    throw error;
  }
  return data || [];
}

/**
 * Get CRM stats for dashboard
 */
export async function getCrmStats(userId: string): Promise<{
  total: number;
  byStatus: Record<ApplicationStatus, number>;
  byPriority: Record<PriorityLevel, number>;
  thisWeek: number;
  fromExternalJobs: number;
}> {
  const { data, error } = await supabase
    .from('crm_applications')
    .select('status, priority, external_job_id, created_at')
    .eq('user_id', userId)
    .eq('is_archived', false);

  if (error) {
    if (error.code === '42P01') {
      // Table doesn't exist, return empty stats
      return {
        total: 0,
        byStatus: {} as Record<ApplicationStatus, number>,
        byPriority: { high: 0, medium: 0, low: 0 },
        thisWeek: 0,
        fromExternalJobs: 0,
      };
    }
    throw error;
  }

  const apps = (data || []) as Array<{
    status: string;
    priority: string;
    external_job_id: string | null;
    created_at: string;
  }>;
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);

  const byStatus = {} as Record<ApplicationStatus, number>;
  const byPriority = { high: 0, medium: 0, low: 0 } as Record<PriorityLevel, number>;

  let thisWeek = 0;
  let fromExternalJobs = 0;

  apps.forEach((app) => {
    // Count by status
    byStatus[app.status as ApplicationStatus] = (byStatus[app.status as ApplicationStatus] || 0) + 1;

    // Count by priority
    if (app.priority in byPriority) {
      byPriority[app.priority as PriorityLevel]++;
    }

    // Count this week
    if (new Date(app.created_at) > weekAgo) {
      thisWeek++;
    }

    // Count from external jobs
    if (app.external_job_id) {
      fromExternalJobs++;
    }
  });

  return {
    total: apps.length,
    byStatus,
    byPriority,
    thisWeek,
    fromExternalJobs,
  };
}
