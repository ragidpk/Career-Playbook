import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useCallback } from 'react';
import {
  getUserResumes,
  getResumeById,
  createResume,
  updateResume,
  deleteResume,
  duplicateResume,
  setPrimaryResume,
  improveResumeContent,
  parseResumePdf,
} from '../services/resumeBuilder.service';
import type {
  UserResume,
  CreateResumeInput,
  UpdateResumeInput,
  WizardStep,
  AIImprovementRequest,
  PersonalInfo,
  WorkExperience,
  Education,
  Skill,
  Certification,
  Project,
} from '../types/resumeBuilder.types';

/**
 * Hook for managing list of user resumes
 */
export function useUserResumes(userId: string | undefined) {
  const queryClient = useQueryClient();

  const resumesQuery = useQuery({
    queryKey: ['user-resumes', userId],
    queryFn: () => getUserResumes(userId!),
    enabled: !!userId,
  });

  const createMutation = useMutation({
    mutationFn: (input?: CreateResumeInput) => createResume(userId!, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-resumes', userId] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteResume,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-resumes', userId] });
    },
  });

  const duplicateMutation = useMutation({
    mutationFn: (resumeId: string) => duplicateResume(resumeId, userId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-resumes', userId] });
    },
  });

  const setPrimaryMutation = useMutation({
    mutationFn: (resumeId: string) => setPrimaryResume(resumeId, userId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-resumes', userId] });
    },
  });

  return {
    resumes: resumesQuery.data || [],
    isLoading: resumesQuery.isLoading,
    error: resumesQuery.error?.message || null,
    refetch: resumesQuery.refetch,
    create: createMutation.mutateAsync,
    remove: deleteMutation.mutateAsync,
    duplicate: duplicateMutation.mutateAsync,
    setPrimary: setPrimaryMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}

/**
 * Hook for editing a single resume with wizard state
 */
export function useResumeEditor(resumeId: string | undefined) {
  const queryClient = useQueryClient();
  const [currentStep, setCurrentStep] = useState<WizardStep>('personal');
  const [isDirty, setIsDirty] = useState(false);

  const resumeQuery = useQuery({
    queryKey: ['resume', resumeId],
    queryFn: () => getResumeById(resumeId!),
    enabled: !!resumeId,
  });

  const updateMutation = useMutation({
    mutationFn: updateResume,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resume', resumeId] });
      queryClient.invalidateQueries({ queryKey: ['user-resumes'] });
      setIsDirty(false);
    },
  });

  // Save resume (debounced updates)
  const saveResume = useCallback(
    async (updates: Partial<UpdateResumeInput>) => {
      if (!resumeId) return;
      setIsDirty(true);
      await updateMutation.mutateAsync({ id: resumeId, ...updates });
    },
    [resumeId, updateMutation]
  );

  // Update personal info
  const updatePersonalInfo = useCallback(
    (info: Partial<PersonalInfo>) => {
      if (!resumeQuery.data) return;
      saveResume({
        personal_info: { ...resumeQuery.data.personal_info, ...info },
      });
    },
    [resumeQuery.data, saveResume]
  );

  // Update professional summary
  const updateSummary = useCallback(
    (summary: string) => {
      saveResume({ professional_summary: summary });
    },
    [saveResume]
  );

  // Work experience operations
  const addWorkExperience = useCallback(
    (exp: WorkExperience) => {
      if (!resumeQuery.data) return;
      saveResume({
        work_experience: [...resumeQuery.data.work_experience, exp],
      });
    },
    [resumeQuery.data, saveResume]
  );

  const updateWorkExperience = useCallback(
    (id: string, updates: Partial<WorkExperience>) => {
      if (!resumeQuery.data) return;
      const updated = resumeQuery.data.work_experience.map((exp) =>
        exp.id === id ? { ...exp, ...updates } : exp
      );
      saveResume({ work_experience: updated });
    },
    [resumeQuery.data, saveResume]
  );

  const removeWorkExperience = useCallback(
    (id: string) => {
      if (!resumeQuery.data) return;
      saveResume({
        work_experience: resumeQuery.data.work_experience.filter((exp) => exp.id !== id),
      });
    },
    [resumeQuery.data, saveResume]
  );

  // Education operations
  const addEducation = useCallback(
    (edu: Education) => {
      if (!resumeQuery.data) return;
      saveResume({
        education: [...resumeQuery.data.education, edu],
      });
    },
    [resumeQuery.data, saveResume]
  );

  const updateEducation = useCallback(
    (id: string, updates: Partial<Education>) => {
      if (!resumeQuery.data) return;
      const updated = resumeQuery.data.education.map((edu) =>
        edu.id === id ? { ...edu, ...updates } : edu
      );
      saveResume({ education: updated });
    },
    [resumeQuery.data, saveResume]
  );

  const removeEducation = useCallback(
    (id: string) => {
      if (!resumeQuery.data) return;
      saveResume({
        education: resumeQuery.data.education.filter((edu) => edu.id !== id),
      });
    },
    [resumeQuery.data, saveResume]
  );

  // Skills operations
  const addSkill = useCallback(
    (skill: Skill) => {
      if (!resumeQuery.data) return;
      saveResume({
        skills: [...resumeQuery.data.skills, skill],
      });
    },
    [resumeQuery.data, saveResume]
  );

  const removeSkill = useCallback(
    (id: string) => {
      if (!resumeQuery.data) return;
      saveResume({
        skills: resumeQuery.data.skills.filter((s) => s.id !== id),
      });
    },
    [resumeQuery.data, saveResume]
  );

  // Certifications operations
  const addCertification = useCallback(
    (cert: Certification) => {
      if (!resumeQuery.data) return;
      saveResume({
        certifications: [...resumeQuery.data.certifications, cert],
      });
    },
    [resumeQuery.data, saveResume]
  );

  const removeCertification = useCallback(
    (id: string) => {
      if (!resumeQuery.data) return;
      saveResume({
        certifications: resumeQuery.data.certifications.filter((c) => c.id !== id),
      });
    },
    [resumeQuery.data, saveResume]
  );

  // Projects operations
  const addProject = useCallback(
    (project: Project) => {
      if (!resumeQuery.data) return;
      saveResume({
        projects: [...resumeQuery.data.projects, project],
      });
    },
    [resumeQuery.data, saveResume]
  );

  const removeProject = useCallback(
    (id: string) => {
      if (!resumeQuery.data) return;
      saveResume({
        projects: resumeQuery.data.projects.filter((p) => p.id !== id),
      });
    },
    [resumeQuery.data, saveResume]
  );

  // Template selection
  const selectTemplate = useCallback(
    (template: UserResume['selected_template']) => {
      saveResume({ selected_template: template });
    },
    [saveResume]
  );

  // Rename resume
  const renameResume = useCallback(
    (name: string) => {
      saveResume({ name });
    },
    [saveResume]
  );

  return {
    resume: resumeQuery.data,
    isLoading: resumeQuery.isLoading,
    error: resumeQuery.error?.message || null,
    isSaving: updateMutation.isPending,
    isDirty,
    currentStep,
    setCurrentStep,
    // Operations
    saveResume,
    updatePersonalInfo,
    updateSummary,
    addWorkExperience,
    updateWorkExperience,
    removeWorkExperience,
    addEducation,
    updateEducation,
    removeEducation,
    addSkill,
    removeSkill,
    addCertification,
    removeCertification,
    addProject,
    removeProject,
    selectTemplate,
    renameResume,
  };
}

/**
 * Hook for AI-powered content improvement
 */
export function useAIImprovement() {
  const [isImproving, setIsImproving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const improve = useCallback(async (request: AIImprovementRequest) => {
    setIsImproving(true);
    setError(null);

    try {
      const result = await improveResumeContent(request);
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to improve content';
      setError(message);
      throw err;
    } finally {
      setIsImproving(false);
    }
  }, []);

  return {
    improve,
    isImproving,
    error,
    clearError: () => setError(null),
  };
}

/**
 * Hook for importing resumes from PDF
 */
export function useResumeImport() {
  const [isImporting, setIsImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const importPdf = useCallback(async (file: File) => {
    setIsImporting(true);
    setError(null);

    try {
      const result = await parseResumePdf(file);
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to import resume';
      setError(message);
      throw err;
    } finally {
      setIsImporting(false);
    }
  }, []);

  return {
    importPdf,
    isImporting,
    error,
    clearError: () => setError(null),
  };
}
