import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useDebounce } from './useDebounce';
import { getCanvas, upsertCanvas } from '../services/canvas.service';
import type { Database } from '../types/database.types';

type CareerCanvas = Database['public']['Tables']['career_canvas']['Row'];

export function useCanvas(userId: string) {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['canvas', userId],
    queryFn: () => getCanvas(userId),
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
        ...newData
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
    },
  });

  const debouncedSave = useDebounce((canvasData: Partial<CareerCanvas>) => {
    mutation.mutate(canvasData);
  }, 2000);

  return { canvas: data, isLoading, save: debouncedSave, isSaving: mutation.isPending };
}
