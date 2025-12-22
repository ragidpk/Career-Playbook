// External Jobs Hooks
// React Query hooks for job discovery and CRM integration

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  searchJobs,
  getExternalJobById,
  importJobFromUrl,
  getUserSavedJobs,
  getUserJobItems,
  saveJob,
  hideJob,
  removeJobItem,
  getJobItemStates,
  isJobTrackedInCrm,
} from '../services/externalJob.service';
import {
  trackJobInCrm,
  getCrmStats,
  type TrackJobInput,
} from '../services/crmIntegration.service';
import type {
  JobSearchParams,
  ImportJobInput,
  JobListFilters,
  ExternalJob,
} from '../types/externalJobs.types';

/**
 * Search for jobs via Jooble API
 */
export function useJobSearch(params: JobSearchParams | null) {
  return useQuery({
    queryKey: ['jobSearch', params],
    queryFn: () => {
      if (!params) throw new Error('Search params are required');
      return searchJobs(params);
    },
    enabled: !!params && !!params.keywords && !!params.location,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  });
}

/**
 * Get a single external job by ID
 */
export function useExternalJobById(jobId: string | undefined) {
  return useQuery({
    queryKey: ['externalJob', jobId],
    queryFn: () => {
      if (!jobId) throw new Error('Job ID is required');
      return getExternalJobById(jobId);
    },
    enabled: !!jobId,
  });
}

/**
 * Get user's saved jobs with full details
 */
export function useUserSavedJobs(userId: string | undefined, filters?: JobListFilters) {
  return useQuery({
    queryKey: ['userSavedJobs', userId, filters],
    queryFn: () => {
      if (!userId) throw new Error('User ID is required');
      return getUserSavedJobs(userId, filters);
    },
    enabled: !!userId,
  });
}

/**
 * Get user's job items (save/hide states)
 */
export function useUserJobItems(userId: string | undefined, filters?: JobListFilters) {
  return useQuery({
    queryKey: ['userJobItems', userId, filters],
    queryFn: () => {
      if (!userId) throw new Error('User ID is required');
      return getUserJobItems(userId, filters);
    },
    enabled: !!userId,
  });
}

/**
 * Get job item states for multiple jobs (batch lookup)
 */
export function useJobItemStates(userId: string | undefined, jobIds: string[]) {
  return useQuery({
    queryKey: ['jobItemStates', userId, jobIds],
    queryFn: () => {
      if (!userId) throw new Error('User ID is required');
      return getJobItemStates(userId, jobIds);
    },
    enabled: !!userId && jobIds.length > 0,
  });
}

/**
 * Check if a job is already tracked in CRM
 */
export function useIsJobTracked(userId: string | undefined, externalJobId: string | undefined) {
  return useQuery({
    queryKey: ['isJobTracked', userId, externalJobId],
    queryFn: async () => {
      if (!userId || !externalJobId) return null;
      const appId = await isJobTrackedInCrm(userId, externalJobId);
      return appId;
    },
    enabled: !!userId && !!externalJobId,
  });
}

/**
 * Get CRM stats for dashboard
 */
export function useCrmStats(userId: string | undefined) {
  return useQuery({
    queryKey: ['crmStats', userId],
    queryFn: () => {
      if (!userId) throw new Error('User ID is required');
      return getCrmStats(userId);
    },
    enabled: !!userId,
  });
}

/**
 * Mutation: Save a job
 * Accepts optional jobData for search results not yet in database
 */
export function useSaveJob() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      userId,
      externalJobId,
      jobData,
    }: {
      userId: string;
      externalJobId: string;
      jobData?: Partial<ExternalJob>;
    }) => saveJob(userId, externalJobId, jobData),
    onSuccess: (_, { userId }) => {
      queryClient.invalidateQueries({ queryKey: ['userSavedJobs', userId] });
      queryClient.invalidateQueries({ queryKey: ['userJobItems', userId] });
      queryClient.invalidateQueries({ queryKey: ['jobItemStates', userId] });
    },
  });
}

/**
 * Mutation: Hide a job
 * Accepts optional jobData for search results not yet in database
 */
export function useHideJob() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      userId,
      externalJobId,
      jobData,
    }: {
      userId: string;
      externalJobId: string;
      jobData?: Partial<ExternalJob>;
    }) => hideJob(userId, externalJobId, jobData),
    onSuccess: (_, { userId }) => {
      queryClient.invalidateQueries({ queryKey: ['userSavedJobs', userId] });
      queryClient.invalidateQueries({ queryKey: ['userJobItems', userId] });
      queryClient.invalidateQueries({ queryKey: ['jobItemStates', userId] });
    },
  });
}

/**
 * Mutation: Remove job from saved/hidden list
 */
export function useRemoveJobItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, externalJobId }: { userId: string; externalJobId: string }) =>
      removeJobItem(userId, externalJobId),
    onSuccess: (_, { userId }) => {
      queryClient.invalidateQueries({ queryKey: ['userSavedJobs', userId] });
      queryClient.invalidateQueries({ queryKey: ['userJobItems', userId] });
      queryClient.invalidateQueries({ queryKey: ['jobItemStates', userId] });
    },
  });
}

/**
 * Mutation: Import a job from URL
 */
export function useImportJob() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: ImportJobInput) => importJobFromUrl(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobSearch'] });
      queryClient.invalidateQueries({ queryKey: ['externalJob'] });
    },
  });
}

/**
 * Mutation: Track a job in CRM
 * Creates crm_companies and crm_applications records
 */
export function useTrackInCrm() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, input }: { userId: string; input: TrackJobInput }) =>
      trackJobInCrm(userId, input),
    onSuccess: (_, { userId, input }) => {
      queryClient.invalidateQueries({ queryKey: ['userSavedJobs', userId] });
      queryClient.invalidateQueries({ queryKey: ['isJobTracked', userId, input.externalJobId] });
      queryClient.invalidateQueries({ queryKey: ['crmStats', userId] });
      queryClient.invalidateQueries({ queryKey: ['crmApplications', userId] });
    },
  });
}

/**
 * Mutation: Import and save a job in one step
 * Useful for the "Import from URL" flow
 */
export function useImportAndSaveJob() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, input }: { userId: string; input: ImportJobInput }) => {
      // Import the job
      const job = await importJobFromUrl(input);
      // Save it for the user
      await saveJob(userId, job.id);
      return job;
    },
    onSuccess: (_, { userId }) => {
      queryClient.invalidateQueries({ queryKey: ['jobSearch'] });
      queryClient.invalidateQueries({ queryKey: ['userSavedJobs', userId] });
      queryClient.invalidateQueries({ queryKey: ['userJobItems', userId] });
    },
  });
}

/**
 * Mutation: Import and track in CRM in one step
 * Useful for quick "Add to Pipeline" flow
 */
export function useImportAndTrackJob() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      userId,
      importInput,
      trackInput,
    }: {
      userId: string;
      importInput: ImportJobInput;
      trackInput?: Omit<TrackJobInput, 'externalJobId'>;
    }) => {
      // Import the job
      const job = await importJobFromUrl(importInput);
      // Track in CRM
      const result = await trackJobInCrm(userId, {
        externalJobId: job.id,
        ...trackInput,
      });
      return result;
    },
    onSuccess: (_, { userId }) => {
      queryClient.invalidateQueries({ queryKey: ['jobSearch'] });
      queryClient.invalidateQueries({ queryKey: ['userSavedJobs', userId] });
      queryClient.invalidateQueries({ queryKey: ['crmStats', userId] });
      queryClient.invalidateQueries({ queryKey: ['crmApplications', userId] });
    },
  });
}
