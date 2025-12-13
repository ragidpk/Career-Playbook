import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getProfile, updateProfile, completeOnboarding } from '../services/profile.service';
import type { Database } from '../types/database.types';

type ProfileUpdate = Database['public']['Tables']['profiles']['Update'];

export function useProfile(userId: string | undefined) {
  const queryClient = useQueryClient();

  const profileQuery = useQuery({
    queryKey: ['profile', userId],
    queryFn: () => getProfile(userId!),
    enabled: !!userId,
  });

  const updateProfileMutation = useMutation({
    mutationFn: (updates: ProfileUpdate) => updateProfile(userId!, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile', userId] });
    },
  });

  const completeOnboardingMutation = useMutation({
    mutationFn: (profileData: ProfileUpdate) => completeOnboarding(userId!, profileData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile', userId] });
    },
  });

  return {
    profile: profileQuery.data,
    isLoading: profileQuery.isLoading,
    error: profileQuery.error,
    updateProfile: updateProfileMutation.mutateAsync,
    completeOnboarding: completeOnboardingMutation.mutateAsync,
    isUpdating: updateProfileMutation.isPending,
    isProfileComplete: profileQuery.data?.profile_completed === true,
  };
}
