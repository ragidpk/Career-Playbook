// Hook for AI-powered job recommendations
// Supports fetching saved recommendations and generating new ones

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  getSavedJobRecommendations,
  generateJobRecommendations,
  type JobRecommendationsInput,
  type JobRecommendations,
  type JobRecommendationsResponse,
} from '../services/jobRecommendations.service';
import { getCanvas } from '../services/canvas.service';
import { useAuth } from './useAuth';

// Query key for caching
const SAVED_RECOMMENDATIONS_KEY = 'savedJobRecommendations';

/**
 * Hook to fetch saved job recommendations from the database
 * Automatically loads on mount when user is authenticated
 */
export function useSavedJobRecommendations() {
  const { user } = useAuth();

  return useQuery({
    queryKey: [SAVED_RECOMMENDATIONS_KEY, user?.id],
    queryFn: getSavedJobRecommendations,
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5, // Consider stale after 5 minutes
    gcTime: 1000 * 60 * 60, // Keep in cache for 1 hour
  });
}

/**
 * Hook to generate new job recommendations
 * Saves to database and updates cache
 */
export function useGenerateJobRecommendations() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: (input: JobRecommendationsInput) =>
      generateJobRecommendations({ ...input, forceRefresh: true }),
    onSuccess: (data) => {
      // Update the saved recommendations cache
      queryClient.setQueryData([SAVED_RECOMMENDATIONS_KEY, user?.id], data);
    },
  });
}

/**
 * Hook to get user's career profile for recommendations
 */
export function useCareerProfile() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['careerProfile', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      const canvas = await getCanvas(user.id);

      if (!canvas || !canvas.target_role) {
        return null;
      }

      return {
        targetRole: canvas.target_role || '',
        currentRole: canvas.current_role || undefined,
        skills: canvas.section_6_skills || undefined,
        industry: canvas.industry || undefined,
      };
    },
    enabled: !!user?.id,
  });
}

export type { JobRecommendations, JobRecommendationsInput, JobRecommendationsResponse };
