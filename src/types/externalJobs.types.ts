// External Jobs Types
// Types for the job discovery and tracking system

export type LocationType = 'remote' | 'hybrid' | 'onsite';
export type JobItemState = 'saved' | 'hidden' | 'applied';
export type JobProvider = 'jooble' | 'manual_url' | 'legacy' | 'openai' | 'perplexity';

export interface ExternalJob {
  id: string;
  provider: JobProvider;
  provider_job_id: string | null;
  canonical_url: string | null;
  title: string;
  company_name: string;
  location: string | null;
  location_type: LocationType | null;
  description_snippet: string | null;
  posted_at: string | null;
  apply_url: string | null;
  salary_min: number | null;
  salary_max: number | null;
  salary_currency: string;
  raw: Record<string, unknown> | null;
  ingested_at: string;
}

export interface UserJobItem {
  id: string;
  user_id: string;
  external_job_id: string;
  state: JobItemState;
  created_at: string;
  updated_at: string;
}

export interface ExternalJobWithState extends ExternalJob {
  user_state?: JobItemState | null;
  crm_application_id?: string | null;
}

// Search parameters
export interface JobSearchParams {
  keywords: string;
  location: string;
  radius?: number;
  salary?: number;
  page?: number;
  location_type?: LocationType;
}

// Search response from edge function
export interface JobSearchResponse {
  jobs: ExternalJob[];
  totalCount: number;
  page: number;
  provider: string;
}

// Import job input
export interface ImportJobInput {
  url: string;
  title: string;
  company_name: string;
  location?: string;
  location_type?: LocationType;
  description_snippet?: string;
  salary_min?: number;
  salary_max?: number;
  salary_currency?: string;
}

// Filter options for listing saved jobs
export interface JobListFilters {
  state?: JobItemState;
  location_type?: LocationType;
  search?: string;
}
