// JD Analysis Hooks
// React Query hooks for job description extraction and resume analysis

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  extractJobDescription,
  analyzeResumeVsJD,
  saveJobDescription,
  getSavedJobDescriptions,
  getJobDescriptionById,
  deleteJobDescription,
  saveAnalysisResult,
  getAnalysisHistory,
  getAnalysisById,
  deleteAnalysis,
} from '../services/jdAnalysis.service';
import type {
  ExtractJDRequest,
  JobDescription,
  SaveJobDescriptionInput,
  CreateAnalysisInput,
} from '../types/jdAnalysis.types';

/**
 * Mutation: Extract JD from URL, file, or text
 */
export function useExtractJD() {
  return useMutation({
    mutationFn: (request: ExtractJDRequest) => extractJobDescription(request),
  });
}

/**
 * Mutation: Analyze resume against job description
 */
export function useAnalyzeResumeVsJD() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      resumeText,
      jobDescription,
    }: {
      resumeText: string;
      jobDescription: JobDescription;
    }) => analyzeResumeVsJD(resumeText, jobDescription),
    onSuccess: () => {
      // Analysis complete, could invalidate related queries if needed
      queryClient.invalidateQueries({ queryKey: ['analysisHistory'] });
    },
  });
}

/**
 * Mutation: Save a job description for reuse
 */
export function useSaveJobDescription() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      userId,
      input,
    }: {
      userId: string;
      input: SaveJobDescriptionInput;
    }) => saveJobDescription(userId, input),
    onSuccess: (_, { userId }) => {
      queryClient.invalidateQueries({ queryKey: ['savedJobDescriptions', userId] });
    },
  });
}

/**
 * Query: Get user's saved job descriptions
 */
export function useSavedJobDescriptions(userId: string | undefined) {
  return useQuery({
    queryKey: ['savedJobDescriptions', userId],
    queryFn: () => {
      if (!userId) throw new Error('User ID is required');
      return getSavedJobDescriptions(userId);
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Query: Get a single job description by ID
 */
export function useJobDescription(id: string | undefined) {
  return useQuery({
    queryKey: ['jobDescription', id],
    queryFn: () => {
      if (!id) throw new Error('Job description ID is required');
      return getJobDescriptionById(id);
    },
    enabled: !!id,
  });
}

/**
 * Mutation: Delete a job description
 */
export function useDeleteJobDescription() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id }: { id: string; userId: string }) =>
      deleteJobDescription(id),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['savedJobDescriptions', variables.userId] });
    },
  });
}

/**
 * Mutation: Save an analysis result
 */
export function useSaveAnalysisResult() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      userId,
      input,
    }: {
      userId: string;
      input: CreateAnalysisInput;
    }) => saveAnalysisResult(userId, input),
    onSuccess: (_, { userId }) => {
      queryClient.invalidateQueries({ queryKey: ['analysisHistory', userId] });
    },
  });
}

/**
 * Query: Get user's analysis history
 */
export function useAnalysisHistory(userId: string | undefined) {
  return useQuery({
    queryKey: ['analysisHistory', userId],
    queryFn: () => {
      if (!userId) throw new Error('User ID is required');
      return getAnalysisHistory(userId);
    },
    enabled: !!userId,
    staleTime: 2 * 60 * 1000,
  });
}

/**
 * Query: Get a single analysis by ID
 */
export function useAnalysis(id: string | undefined) {
  return useQuery({
    queryKey: ['analysis', id],
    queryFn: () => {
      if (!id) throw new Error('Analysis ID is required');
      return getAnalysisById(id);
    },
    enabled: !!id,
  });
}

/**
 * Mutation: Delete an analysis
 */
export function useDeleteAnalysis() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id }: { id: string; userId: string }) =>
      deleteAnalysis(id),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['analysisHistory', variables.userId] });
    },
  });
}

/**
 * Combined mutation: Extract JD, analyze, and save results in one step
 */
export function useFullAnalysisFlow() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      userId,
      extractRequest,
      resumeText,
      resumeFileName,
    }: {
      userId: string;
      extractRequest: ExtractJDRequest;
      resumeText: string;
      resumeFileName?: string;
    }) => {
      // Step 1: Extract JD
      const jobDescription = await extractJobDescription(extractRequest);

      // Step 2: Save JD
      const savedJD = await saveJobDescription(userId, {
        title: jobDescription.title,
        company: jobDescription.company,
        location: jobDescription.location,
        description: jobDescription.description,
        requirements: jobDescription.requirements,
        skills: jobDescription.skills,
        experience_required: jobDescription.experience_required,
        source_url: extractRequest.url,
        source_type: extractRequest.source,
      });

      // Step 3: Analyze
      const analysis = await analyzeResumeVsJD(resumeText, jobDescription);

      // Step 4: Save analysis result
      const savedAnalysis = await saveAnalysisResult(userId, {
        job_description_id: savedJD.id!,
        resume_file_name: resumeFileName,
        resume_text: resumeText,
        match_score: analysis.matchScore,
        keyword_analysis: analysis.keywordAnalysis,
        section_analysis: analysis.sectionAnalysis,
        improvements: analysis.improvements,
        tailored_summary: analysis.tailoredSummary,
        action_items: analysis.actionItems,
      });

      return {
        jobDescription: savedJD,
        analysis: savedAnalysis,
        result: analysis,
      };
    },
    onSuccess: (_, { userId }) => {
      queryClient.invalidateQueries({ queryKey: ['savedJobDescriptions', userId] });
      queryClient.invalidateQueries({ queryKey: ['analysisHistory', userId] });
    },
  });
}
