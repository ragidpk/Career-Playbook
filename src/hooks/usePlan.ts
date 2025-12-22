import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import {
  getPlans,
  getPlan,
  createPlan,
  updateMilestone,
  reorderMilestones,
  deletePlan,
  createContinuationPlan,
} from '../services/plan.service';
import type { Database } from '../types/database.types';

type WeeklyMilestone = Database['public']['Tables']['weekly_milestones']['Row'];
type CreatePlanInput = Database['public']['Tables']['ninety_day_plans']['Insert'];

export function usePlans(userId: string | undefined) {
  const queryClient = useQueryClient();

  const plansQuery = useQuery({
    queryKey: ['plans', userId],
    queryFn: () => getPlans(userId!),
    enabled: !!userId,
  });

  const createPlanMutation = useMutation({
    mutationFn: ({ plan, templateId }: { plan: Omit<CreatePlanInput, 'user_id'>; templateId?: string | null }) =>
      createPlan(userId!, plan, templateId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plans', userId] });
    },
  });

  const deletePlanMutation = useMutation({
    mutationFn: deletePlan,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plans', userId] });
    },
  });

  return {
    plans: plansQuery.data || [],
    isLoading: plansQuery.isLoading,
    error: plansQuery.error,
    createPlan: createPlanMutation.mutateAsync,
    deletePlan: deletePlanMutation.mutateAsync,
    isCreating: createPlanMutation.isPending,
    isDeleting: deletePlanMutation.isPending,
  };
}

export function usePlan(planId: string | undefined) {
  const queryClient = useQueryClient();
  const [localMilestones, setLocalMilestones] = useState<WeeklyMilestone[]>([]);

  const planQuery = useQuery({
    queryKey: ['plan', planId],
    queryFn: () => getPlan(planId!),
    enabled: !!planId,
  });

  // Sync local milestones when plan data changes
  useEffect(() => {
    if (planQuery.data?.weekly_milestones) {
      setLocalMilestones(planQuery.data.weekly_milestones);
    }
  }, [planQuery.data]);

  const updateMilestoneMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<WeeklyMilestone> }) =>
      updateMilestone(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plan', planId] });
    },
  });

  const reorderMutation = useMutation({
    mutationFn: reorderMilestones,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plan', planId] });
    },
  });

  const continuationMutation = useMutation({
    mutationFn: ({ userId, parentPlanId, title }: { userId: string; parentPlanId: string; title: string }) =>
      createContinuationPlan(userId, parentPlanId, title),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plans'] });
    },
  });

  const updateOrder = (reorderedMilestones: WeeklyMilestone[]) => {
    // Optimistically update local state
    setLocalMilestones(reorderedMilestones);

    // Map to order updates
    const updates = reorderedMilestones.map((milestone, index) => ({
      id: milestone.id,
      order_index: index,
    }));

    // Batch update on server
    reorderMutation.mutate(updates);
  };

  const updateMilestoneField = (id: string, updates: Partial<WeeklyMilestone>) => {
    updateMilestoneMutation.mutate({ id, updates });
  };

  return {
    plan: planQuery.data,
    milestones: localMilestones.length > 0 ? localMilestones : planQuery.data?.weekly_milestones || [],
    isLoading: planQuery.isLoading,
    error: planQuery.error,
    updateMilestone: updateMilestoneField,
    updateOrder,
    createContinuationPlan: continuationMutation.mutateAsync,
    isUpdating: updateMilestoneMutation.isPending,
    isReordering: reorderMutation.isPending,
    isCreatingContinuation: continuationMutation.isPending,
  };
}
