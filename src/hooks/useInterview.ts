import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getInterviews,
  getInterviewsByCompany,
  getUpcomingInterviews,
  createInterview,
  updateInterview,
  deleteInterview,
  type Interview,
  type CreateInterviewInput,
} from '../services/interview.service';

export function useInterviews(userId: string | undefined) {
  const queryClient = useQueryClient();

  const interviewsQuery = useQuery({
    queryKey: ['interviews', userId],
    queryFn: () => getInterviews(userId!),
    enabled: !!userId,
  });

  const createMutation = useMutation({
    mutationFn: (interview: Omit<CreateInterviewInput, 'user_id'>) =>
      createInterview(userId!, interview),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['interviews', userId] });
      queryClient.invalidateQueries({ queryKey: ['upcoming-interviews', userId] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Interview> }) =>
      updateInterview(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['interviews', userId] });
      queryClient.invalidateQueries({ queryKey: ['upcoming-interviews', userId] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteInterview,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['interviews', userId] });
      queryClient.invalidateQueries({ queryKey: ['upcoming-interviews', userId] });
    },
  });

  return {
    interviews: interviewsQuery.data || [],
    isLoading: interviewsQuery.isLoading,
    error: interviewsQuery.error,
    createInterview: createMutation.mutateAsync,
    updateInterview: updateMutation.mutateAsync,
    deleteInterview: deleteMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}

export function useUpcomingInterviews(userId: string | undefined, days: number = 7) {
  return useQuery({
    queryKey: ['upcoming-interviews', userId, days],
    queryFn: () => getUpcomingInterviews(userId!, days),
    enabled: !!userId,
  });
}

export function useInterviewsByCompany(companyId: string | undefined) {
  return useQuery({
    queryKey: ['interviews-by-company', companyId],
    queryFn: () => getInterviewsByCompany(companyId!),
    enabled: !!companyId,
  });
}
