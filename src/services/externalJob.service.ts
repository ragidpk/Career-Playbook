// External Job Service
// Handles job discovery, save/hide states, and manual imports

import { supabase } from './supabase';
import type {
  ExternalJob,
  UserJobItem,
  ExternalJobWithState,
  JobSearchParams,
  JobSearchResponse,
  ImportJobInput,
  JobListFilters,
  JobItemState,
} from '../types/externalJobs.types';

/**
 * Search for jobs via Jooble API (through edge function)
 */
export async function searchJobs(params: JobSearchParams): Promise<JobSearchResponse> {
  const { data: { session } } = await supabase.auth.getSession();

  const response = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/search-jobs`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session?.access_token || ''}`,
      },
      body: JSON.stringify(params),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to search jobs');
  }

  return response.json();
}

/**
 * Get an external job by ID
 */
export async function getExternalJobById(jobId: string): Promise<ExternalJob | null> {
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
 * Get external job by canonical URL (for deduplication)
 */
export async function getExternalJobByUrl(url: string): Promise<ExternalJob | null> {
  const { data, error } = await supabase
    .from('external_jobs')
    .select('*')
    .eq('canonical_url', url)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }
  return data;
}

/**
 * Import a job manually from URL
 * Creates an external_job record via edge function (uses service_role)
 */
export async function importJobFromUrl(input: ImportJobInput): Promise<ExternalJob> {
  const { data: { session } } = await supabase.auth.getSession();

  const response = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/import-job`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session?.access_token || ''}`,
      },
      body: JSON.stringify({
        url: input.url,
        title: input.title,
        company_name: input.company_name,
        location: input.location,
        location_type: input.location_type,
        description_snippet: input.description_snippet,
        salary_min: input.salary_min,
        salary_max: input.salary_max,
        salary_currency: input.salary_currency,
      }),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to import job');
  }

  const result = await response.json();
  return result.job;
}


/**
 * Get user's saved/hidden job items
 */
export async function getUserJobItems(userId: string, filters?: JobListFilters): Promise<UserJobItem[]> {
  let query = supabase
    .from('user_job_items')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (filters?.state) {
    query = query.eq('state', filters.state);
  }

  const { data, error } = await query;

  if (error) {
    // Table might not exist yet
    if (error.code === '42P01') return [];
    throw error;
  }
  return data || [];
}

/**
 * Get user's saved jobs with full job details
 */
export async function getUserSavedJobs(
  userId: string,
  filters?: JobListFilters
): Promise<ExternalJobWithState[]> {
  // Get user's job items (saved state by default)
  const state = filters?.state || 'saved';
  const items = await getUserJobItems(userId, { ...filters, state });

  if (items.length === 0) return [];

  // Get full job details
  const jobIds = items.map(item => item.external_job_id);
  const { data: jobs, error } = await supabase
    .from('external_jobs')
    .select('*')
    .in('id', jobIds);

  if (error) throw error;

  // Merge job data with user state
  const jobMap = new Map((jobs || []).map((j) => [(j as ExternalJob).id, j as ExternalJob]));
  const itemMap = new Map(items.map(i => [i.external_job_id, i]));

  // Check which jobs are already tracked in CRM
  const { data: crmApps } = await supabase
    .from('crm_applications')
    .select('id, external_job_id')
    .eq('user_id', userId)
    .in('external_job_id', jobIds);

  const crmMap = new Map((crmApps || []).map((a) => [(a as { external_job_id: string; id: string }).external_job_id, (a as { external_job_id: string; id: string }).id]));

  const result: ExternalJobWithState[] = [];
  for (const id of jobIds) {
    const job = jobMap.get(id);
    const item = itemMap.get(id);
    if (!job) continue;
    result.push({
      ...job,
      user_state: item?.state || null,
      crm_application_id: crmMap.get(id) || null,
    });
  }
  return result;
}

/**
 * Ensure a job exists in the external_jobs table
 * For search results from AI providers that aren't persisted yet
 */
export async function ensureJobInDatabase(job: ExternalJob): Promise<ExternalJob> {
  // First check if job exists by ID
  const existing = await getExternalJobById(job.id);
  if (existing) return existing;

  // Check by canonical URL if available (for deduplication)
  if (job.canonical_url) {
    const byUrl = await getExternalJobByUrl(job.canonical_url);
    if (byUrl) return byUrl;
  }

  // Insert the job into external_jobs table
  const { data, error } = await supabase
    .from('external_jobs')
    // @ts-expect-error - Table not yet in generated types
    .insert({
      id: job.id,
      provider: job.provider,
      provider_job_id: job.provider_job_id || job.id,
      canonical_url: job.canonical_url,
      title: job.title,
      company_name: job.company_name,
      location: job.location,
      location_type: job.location_type,
      description_snippet: job.description_snippet,
      posted_at: job.posted_at,
      apply_url: job.apply_url,
      salary_min: job.salary_min,
      salary_max: job.salary_max,
      salary_currency: job.salary_currency || 'USD',
      raw: job.raw || null,
      ingested_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    // If duplicate key error, try to fetch existing
    if (error.code === '23505') {
      const retryExisting = await getExternalJobById(job.id);
      if (retryExisting) return retryExisting;
    }
    throw error;
  }
  return data as ExternalJob;
}

/**
 * Save a job for the user
 * Optionally accepts job data for search results not yet in database
 */
export async function saveJob(
  userId: string,
  externalJobId: string,
  jobData?: Partial<ExternalJob>
): Promise<UserJobItem> {
  // If job data provided, ensure it exists in external_jobs first
  if (jobData) {
    const fullJob: ExternalJob = {
      id: externalJobId,
      provider: (jobData.provider as ExternalJob['provider']) || 'openai',
      provider_job_id: jobData.provider_job_id || externalJobId,
      canonical_url: jobData.canonical_url || null,
      title: jobData.title || 'Unknown',
      company_name: jobData.company_name || 'Unknown',
      location: jobData.location || null,
      location_type: jobData.location_type || null,
      description_snippet: jobData.description_snippet || null,
      posted_at: jobData.posted_at || null,
      apply_url: jobData.apply_url || null,
      salary_min: jobData.salary_min || null,
      salary_max: jobData.salary_max || null,
      salary_currency: jobData.salary_currency || 'USD',
      raw: jobData.raw || null,
      ingested_at: jobData.ingested_at || new Date().toISOString(),
    };
    await ensureJobInDatabase(fullJob);
  }

  const { data, error } = await supabase
    .from('user_job_items')
    // @ts-expect-error - Table not yet in generated types
    .upsert(
      {
        user_id: userId,
        external_job_id: externalJobId,
        state: 'saved',
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,external_job_id' }
    )
    .select()
    .single();

  if (error) throw error;
  return data as UserJobItem;
}

/**
 * Hide a job for the user
 * Optionally accepts job data for search results not yet in database
 */
export async function hideJob(
  userId: string,
  externalJobId: string,
  jobData?: Partial<ExternalJob>
): Promise<UserJobItem> {
  // If job data provided, ensure it exists in external_jobs first
  if (jobData) {
    const fullJob: ExternalJob = {
      id: externalJobId,
      provider: (jobData.provider as ExternalJob['provider']) || 'openai',
      provider_job_id: jobData.provider_job_id || externalJobId,
      canonical_url: jobData.canonical_url || null,
      title: jobData.title || 'Unknown',
      company_name: jobData.company_name || 'Unknown',
      location: jobData.location || null,
      location_type: jobData.location_type || null,
      description_snippet: jobData.description_snippet || null,
      posted_at: jobData.posted_at || null,
      apply_url: jobData.apply_url || null,
      salary_min: jobData.salary_min || null,
      salary_max: jobData.salary_max || null,
      salary_currency: jobData.salary_currency || 'USD',
      raw: jobData.raw || null,
      ingested_at: jobData.ingested_at || new Date().toISOString(),
    };
    await ensureJobInDatabase(fullJob);
  }

  const { data, error } = await supabase
    .from('user_job_items')
    // @ts-expect-error - Table not yet in generated types
    .upsert(
      {
        user_id: userId,
        external_job_id: externalJobId,
        state: 'hidden',
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,external_job_id' }
    )
    .select()
    .single();

  if (error) throw error;
  return data as UserJobItem;
}

/**
 * Update job item state
 */
export async function updateJobItemState(
  userId: string,
  externalJobId: string,
  state: JobItemState
): Promise<UserJobItem> {
  const { data, error } = await supabase
    .from('user_job_items')
    // @ts-expect-error - Table not yet in generated types
    .upsert(
      {
        user_id: userId,
        external_job_id: externalJobId,
        state,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,external_job_id' }
    )
    .select()
    .single();

  if (error) throw error;
  return data as UserJobItem;
}

/**
 * Remove a job from user's list (unsave/unhide)
 */
export async function removeJobItem(userId: string, externalJobId: string): Promise<void> {
  const { error } = await supabase
    .from('user_job_items')
    .delete()
    .eq('user_id', userId)
    .eq('external_job_id', externalJobId);

  if (error) throw error;
}

/**
 * Get the user's state for a specific job
 */
export async function getJobItemState(
  userId: string,
  externalJobId: string
): Promise<JobItemState | null> {
  const { data, error } = await supabase
    .from('user_job_items')
    .select('state')
    .eq('user_id', userId)
    .eq('external_job_id', externalJobId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }
  // @ts-expect-error - Table not yet in generated types
  return data?.state || null;
}

/**
 * Get multiple job states at once (for batch operations)
 */
export async function getJobItemStates(
  userId: string,
  externalJobIds: string[]
): Promise<Map<string, JobItemState>> {
  if (externalJobIds.length === 0) return new Map();

  const { data, error } = await supabase
    .from('user_job_items')
    .select('external_job_id, state')
    .eq('user_id', userId)
    .in('external_job_id', externalJobIds);

  if (error) {
    if (error.code === '42P01') return new Map();
    throw error;
  }

  return new Map((data || []).map((item) => [(item as { external_job_id: string; state: string }).external_job_id, (item as { external_job_id: string; state: string }).state as JobItemState]));
}

/**
 * Check if a job is already tracked in CRM
 */
export async function isJobTrackedInCrm(userId: string, externalJobId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('crm_applications')
    .select('id')
    .eq('user_id', userId)
    .eq('external_job_id', externalJobId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }
  // @ts-expect-error - Table not yet in generated types
  return data?.id || null;
}
