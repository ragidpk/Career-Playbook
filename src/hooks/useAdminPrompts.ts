import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getAIPrompts,
  updateAIPrompt,
  createAIPrompt,
  deleteAIPrompt,
  type AIPromptInsert,
  type AIPromptUpdate,
} from '../services/ai-prompts.service';

export function useAdminPrompts() {
  const queryClient = useQueryClient();

  const {
    data: prompts = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['admin-ai-prompts'],
    queryFn: getAIPrompts,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: AIPromptUpdate }) =>
      updateAIPrompt(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-ai-prompts'] });
    },
  });

  const createMutation = useMutation({
    mutationFn: (prompt: AIPromptInsert) => createAIPrompt(prompt),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-ai-prompts'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteAIPrompt(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-ai-prompts'] });
    },
  });

  return {
    prompts,
    isLoading,
    error: error?.message || null,
    refresh: refetch,
    update: (id: string, updates: AIPromptUpdate) =>
      updateMutation.mutateAsync({ id, updates }),
    create: createMutation.mutateAsync,
    remove: deleteMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
    isCreating: createMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
