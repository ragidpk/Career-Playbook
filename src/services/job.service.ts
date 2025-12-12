import { supabase } from './supabase';
import type { Database } from '../types/database.types';

type JobListing = Database['public']['Tables']['job_listings']['Row'];
type CreateJobInput = Database['public']['Tables']['job_listings']['Insert'];
type UpdateJobInput = Database['public']['Tables']['job_listings']['Update'];

export interface JobFilters {
  status?: JobListing['application_status'][];
  source?: JobListing['source'][];
  isFavorite?: boolean;
  search?: string;
}

export interface JobStats {
  total: number;
  saved: number;
  applied: number;
  interviewing: number;
  offer: number;
  rejected: number;
  withdrawn: number;
}

export async function getJobListings(userId: string, filters?: JobFilters): Promise<JobListing[]> {
  let query = supabase
    .from('job_listings')
    .select('*')
    .eq('user_id', userId);

  if (filters?.status && filters.status.length > 0) {
    query = query.in('application_status', filters.status);
  }

  if (filters?.source && filters.source.length > 0) {
    query = query.in('source', filters.source);
  }

  if (filters?.isFavorite) {
    query = query.eq('is_favorite', true);
  }

  if (filters?.search) {
    query = query.or(`title.ilike.%${filters.search}%,company_name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
  }

  query = query.order('created_at', { ascending: false });

  const { data, error } = await query;

  if (error) throw error;
  return data || [];
}

export async function getJobById(id: string): Promise<JobListing> {
  const { data, error } = await supabase
    .from('job_listings')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
}

export async function createJobListing(userId: string, job: Omit<CreateJobInput, 'user_id'>): Promise<JobListing> {
  const { data, error } = await supabase
    .from('job_listings')
    // @ts-expect-error - Supabase typing issue
    .insert({ user_id: userId, ...job })
    .select()
    .single();

  if (error) throw error;
  return data as JobListing;
}

export async function updateJobListing(jobId: string, updates: Partial<JobListing>): Promise<JobListing> {
  const { data, error } = await supabase
    .from('job_listings')
    // @ts-expect-error - Supabase typing issue
    .update(updates)
    .eq('id', jobId)
    .select()
    .single();

  if (error) throw error;
  return data as JobListing;
}

export async function deleteJobListing(jobId: string): Promise<void> {
  const { error } = await supabase
    .from('job_listings')
    .delete()
    .eq('id', jobId);

  if (error) throw error;
}

export async function toggleFavorite(jobId: string, isFavorite: boolean): Promise<JobListing> {
  return updateJobListing(jobId, { is_favorite: isFavorite });
}

export async function getJobStats(userId: string): Promise<JobStats> {
  const jobs = await getJobListings(userId);

  return {
    total: jobs.length,
    saved: jobs.filter((j) => j.application_status === 'saved').length,
    applied: jobs.filter((j) => j.application_status === 'applied').length,
    interviewing: jobs.filter((j) => j.application_status === 'interviewing').length,
    offer: jobs.filter((j) => j.application_status === 'offer').length,
    rejected: jobs.filter((j) => j.application_status === 'rejected').length,
    withdrawn: jobs.filter((j) => j.application_status === 'withdrawn').length,
  };
}

export type { JobListing, CreateJobInput, UpdateJobInput };
