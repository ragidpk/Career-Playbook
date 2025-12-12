import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getJobListings,
  getJobById,
  createJobListing,
  updateJobListing,
  deleteJobListing,
  toggleFavorite,
  getJobStats,
  type JobListing,
  type CreateJobInput,
  type JobFilters,
} from '../services/job.service';

export function useJobListings(userId: string | undefined, filters?: JobFilters) {
  return useQuery({
    queryKey: ['jobs', userId, filters],
    queryFn: () => {
      if (!userId) throw new Error('User ID is required');
      return getJobListings(userId, filters);
    },
    enabled: !!userId,
  });
}

export function useJobById(jobId: string | undefined) {
  return useQuery({
    queryKey: ['job', jobId],
    queryFn: () => {
      if (!jobId) throw new Error('Job ID is required');
      return getJobById(jobId);
    },
    enabled: !!jobId,
  });
}

export function useJobStats(userId: string | undefined) {
  return useQuery({
    queryKey: ['jobStats', userId],
    queryFn: () => {
      if (!userId) throw new Error('User ID is required');
      return getJobStats(userId);
    },
    enabled: !!userId,
  });
}

export function useCreateJob() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, job }: { userId: string; job: Omit<CreateJobInput, 'user_id'> }) =>
      createJobListing(userId, job),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      queryClient.invalidateQueries({ queryKey: ['jobStats'] });
    },
  });
}

export function useUpdateJob() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ jobId, updates }: { jobId: string; updates: Partial<JobListing> }) =>
      updateJobListing(jobId, updates),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      queryClient.invalidateQueries({ queryKey: ['job', data.id] });
      queryClient.invalidateQueries({ queryKey: ['jobStats'] });
    },
  });
}

export function useDeleteJob() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (jobId: string) => deleteJobListing(jobId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      queryClient.invalidateQueries({ queryKey: ['jobStats'] });
    },
  });
}

export function useToggleFavorite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ jobId, isFavorite }: { jobId: string; isFavorite: boolean }) =>
      toggleFavorite(jobId, isFavorite),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      queryClient.invalidateQueries({ queryKey: ['job', data.id] });
    },
  });
}
