// Job Recommendations Service
// Calls AI to generate personalized job title recommendations
// Supports fetching saved recommendations and generating new ones

import { supabase } from './supabase';

export interface JobRecommendationsInput {
  targetRole: string;
  currentRole?: string;
  skills?: string;
  locations?: string[];
  seniority?: string;
  industry?: string;
  workType?: string;
  forceRefresh?: boolean;
}

export interface JobRecommendations {
  bestMatchTitles: string[];
  adjacentTitles: string[];
  titleVariations: string[];
  keywordPack: string[];
  positioningSummary: string;
}

export interface JobRecommendationsResponse {
  recommendations: JobRecommendations | null;
  savedAt?: string;
  fromCache?: boolean;
  input?: JobRecommendationsInput;
}

/**
 * Fetch saved job recommendations (GET request)
 * Returns null if no saved recommendations exist
 */
export async function getSavedJobRecommendations(): Promise<JobRecommendationsResponse> {
  const { data: { session } } = await supabase.auth.getSession();

  if (!session?.access_token) {
    throw new Error('Authentication required');
  }

  const response = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/job-recommendations`,
    {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
      },
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to fetch saved recommendations');
  }

  return response.json();
}

/**
 * Generate new job recommendations (POST request)
 * If forceRefresh is false/undefined, returns cached recommendations if they exist
 * If forceRefresh is true, always generates new recommendations
 */
export async function generateJobRecommendations(
  input: JobRecommendationsInput
): Promise<JobRecommendationsResponse> {
  const { data: { session } } = await supabase.auth.getSession();

  if (!session?.access_token) {
    throw new Error('Authentication required');
  }

  const response = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/job-recommendations`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify(input),
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to generate job recommendations');
  }

  const data = await response.json();

  if (data.error) {
    throw new Error(data.error);
  }

  return data;
}

/**
 * Legacy function for backward compatibility
 * @deprecated Use generateJobRecommendations instead
 */
export async function getJobRecommendations(
  input: JobRecommendationsInput
): Promise<JobRecommendations> {
  const response = await generateJobRecommendations(input);
  if (!response.recommendations) {
    throw new Error('No recommendations generated');
  }
  return response.recommendations;
}
