import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useDebounce } from './useDebounce';
import {
  getCanvas,
  getAllCanvases,
  getCanvasById,
  upsertCanvas,
  createCanvas,
  updateCanvas,
  deleteCanvas,
  linkCanvasToPlan,
  MAX_CANVASES,
  type CreateCanvasInput,
} from '../services/canvas.service';
import type { Database } from '../types/database.types';

type CareerCanvas = Database['public']['Tables']['career_canvas']['Row'];

// Hook for backward compatibility - gets the primary canvas
export function useCanvas(userId: string) {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['canvas', userId],
    queryFn: () => getCanvas(userId),
    enabled: !!userId,
  });

  const mutation = useMutation({
    mutationFn: (canvasData: Partial<CareerCanvas>) => upsertCanvas(userId, canvasData),
    onMutate: async (newData) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['canvas', userId] });

      // Snapshot previous value
      const previousCanvas = queryClient.getQueryData(['canvas', userId]);

      // Optimistically update to keep UI snappy
      queryClient.setQueryData(['canvas', userId], (old: any) => ({
        ...old,
        ...newData,
      }));

      return { previousCanvas };
    },
    onError: (_err, _newData, context) => {
      // Rollback on error
      queryClient.setQueryData(['canvas', userId], context?.previousCanvas);
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: ['canvas', userId] });
      queryClient.invalidateQueries({ queryKey: ['canvases', userId] });
    },
  });

  const debouncedSave = useDebounce((canvasData: Partial<CareerCanvas>) => {
    mutation.mutate(canvasData);
  }, 2000);

  return { canvas: data, isLoading, save: debouncedSave, isSaving: mutation.isPending };
}

// Hook for managing multiple canvases
export function useMultipleCanvases(userId: string) {
  const queryClient = useQueryClient();

  // Fetch all canvases
  const {
    data: canvases = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ['canvases', userId],
    queryFn: () => getAllCanvases(userId),
    enabled: !!userId,
  });

  // Create a new canvas
  const createMutation = useMutation({
    mutationFn: (input: string | CreateCanvasInput) => createCanvas(userId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['canvases', userId] });
      queryClient.invalidateQueries({ queryKey: ['canvas', userId] });
    },
  });

  // Update a canvas
  const updateMutation = useMutation({
    mutationFn: ({ canvasId, data }: { canvasId: string; data: Partial<CareerCanvas> }) =>
      updateCanvas(canvasId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['canvases', userId] });
      queryClient.invalidateQueries({ queryKey: ['canvas', userId] });
    },
  });

  // Delete a canvas
  const deleteMutation = useMutation({
    mutationFn: (canvasId: string) => deleteCanvas(canvasId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['canvases', userId] });
      queryClient.invalidateQueries({ queryKey: ['canvas', userId] });
    },
  });

  // Link canvas to plan
  const linkToPlanMutation = useMutation({
    mutationFn: ({ canvasId, planId }: { canvasId: string; planId: string }) =>
      linkCanvasToPlan(canvasId, planId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['canvases', userId] });
    },
  });

  const canCreateMore = canvases.length < MAX_CANVASES;

  return {
    canvases,
    isLoading,
    error: error instanceof Error ? error.message : null,
    canCreateMore,
    maxCanvases: MAX_CANVASES,
    create: createMutation.mutateAsync,
    update: (canvasId: string, data: Partial<CareerCanvas>) =>
      updateMutation.mutateAsync({ canvasId, data }),
    remove: deleteMutation.mutateAsync,
    linkToPlan: (canvasId: string, planId: string) =>
      linkToPlanMutation.mutateAsync({ canvasId, planId }),
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}

// Hook for a single canvas by ID
export function useCanvasById(canvasId: string) {
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ['canvas', 'id', canvasId],
    queryFn: () => getCanvasById(canvasId),
    enabled: !!canvasId,
  });

  const updateMutation = useMutation({
    mutationFn: (canvasData: Partial<CareerCanvas>) => updateCanvas(canvasId, canvasData),
    onMutate: async (newData) => {
      await queryClient.cancelQueries({ queryKey: ['canvas', 'id', canvasId] });
      const previousCanvas = queryClient.getQueryData(['canvas', 'id', canvasId]);

      queryClient.setQueryData(['canvas', 'id', canvasId], (old: any) => ({
        ...old,
        ...newData,
      }));

      return { previousCanvas };
    },
    onError: (_err, _newData, context) => {
      queryClient.setQueryData(['canvas', 'id', canvasId], context?.previousCanvas);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['canvas', 'id', canvasId] });
      queryClient.invalidateQueries({ queryKey: ['canvases'] });
    },
  });

  const debouncedSave = useDebounce((canvasData: Partial<CareerCanvas>) => {
    updateMutation.mutate(canvasData);
  }, 2000);

  return {
    canvas: data,
    isLoading,
    error: error instanceof Error ? error.message : null,
    save: debouncedSave,
    saveImmediate: updateMutation.mutateAsync,
    isSaving: updateMutation.isPending,
  };
}
