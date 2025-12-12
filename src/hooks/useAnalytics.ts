import { useQuery } from '@tanstack/react-query';
import {
  getApplicationFunnel,
  getWeeklyActivity,
  getCompanyStatusBreakdown,
  getPlanProgress,
  getCanvasCompletion,
  getOverallStats,
  type ApplicationFunnelData,
  type WeeklyActivityData,
  type CompanyStatusBreakdown,
  type PlanProgress,
  type CanvasCompletion,
  type OverallStats,
} from '../services/analytics.service';

export function useApplicationFunnel(userId: string | undefined) {
  return useQuery<ApplicationFunnelData>({
    queryKey: ['analytics', 'funnel', userId],
    queryFn: () => getApplicationFunnel(userId!),
    enabled: !!userId,
  });
}

export function useWeeklyActivity(userId: string | undefined, weeks: number = 12) {
  return useQuery<WeeklyActivityData[]>({
    queryKey: ['analytics', 'activity', userId, weeks],
    queryFn: () => getWeeklyActivity(userId!, weeks),
    enabled: !!userId,
  });
}

export function useCompanyStatusBreakdown(userId: string | undefined) {
  return useQuery<CompanyStatusBreakdown[]>({
    queryKey: ['analytics', 'statusBreakdown', userId],
    queryFn: () => getCompanyStatusBreakdown(userId!),
    enabled: !!userId,
  });
}

export function usePlanProgress(userId: string | undefined) {
  return useQuery<PlanProgress>({
    queryKey: ['analytics', 'planProgress', userId],
    queryFn: () => getPlanProgress(userId!),
    enabled: !!userId,
  });
}

export function useCanvasCompletion(userId: string | undefined) {
  return useQuery<CanvasCompletion>({
    queryKey: ['analytics', 'canvasCompletion', userId],
    queryFn: () => getCanvasCompletion(userId!),
    enabled: !!userId,
  });
}

export function useOverallStats(userId: string | undefined) {
  return useQuery<OverallStats>({
    queryKey: ['analytics', 'overallStats', userId],
    queryFn: () => getOverallStats(userId!),
    enabled: !!userId,
  });
}

export function useDashboardData(userId: string | undefined) {
  const funnel = useApplicationFunnel(userId);
  const activity = useWeeklyActivity(userId);
  const statusBreakdown = useCompanyStatusBreakdown(userId);
  const planProgress = usePlanProgress(userId);
  const canvasCompletion = useCanvasCompletion(userId);
  const overallStats = useOverallStats(userId);

  return {
    funnel: funnel.data,
    activity: activity.data,
    statusBreakdown: statusBreakdown.data,
    planProgress: planProgress.data,
    canvasCompletion: canvasCompletion.data,
    overallStats: overallStats.data,
    isLoading:
      funnel.isLoading ||
      activity.isLoading ||
      statusBreakdown.isLoading ||
      planProgress.isLoading ||
      canvasCompletion.isLoading ||
      overallStats.isLoading,
    error:
      funnel.error ||
      activity.error ||
      statusBreakdown.error ||
      planProgress.error ||
      canvasCompletion.error ||
      overallStats.error,
  };
}
