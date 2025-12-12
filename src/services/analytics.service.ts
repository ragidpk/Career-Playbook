import { supabase } from './supabase';
import type { Database } from '../types/database.types';

type WeeklyMilestone = Database['public']['Tables']['weekly_milestones']['Row'];

export interface ApplicationFunnelData {
  researching: number;
  applied: number;
  interviewing: number;
  offer: number;
  rejected: number;
}

export interface WeeklyActivityData {
  week: string;
  count: number;
}

export interface CompanyStatusBreakdown {
  status: string;
  count: number;
  percentage: number;
}

export interface PlanProgress {
  totalMilestones: number;
  completed: number;
  inProgress: number;
  notStarted: number;
  completionPercentage: number;
}

export interface CanvasCompletion {
  sectionsCompleted: number;
  totalSections: number;
  completionPercentage: number;
}

export interface OverallStats {
  totalApplications: number;
  interviewsThisWeek: number;
  activeCompanies: number;
  planProgress: number;
  canvasCompletion: number;
}

export async function getApplicationFunnel(userId: string): Promise<ApplicationFunnelData> {
  const { data, error } = await supabase
    .from('companies')
    .select('status')
    .eq('user_id', userId);

  if (error) throw error;

  const companies = (data || []) as { status: string }[];

  return {
    researching: companies.filter(c => c.status === 'researching').length,
    applied: companies.filter(c => c.status === 'applied').length,
    interviewing: companies.filter(c => c.status === 'interviewing').length,
    offer: companies.filter(c => c.status === 'offer').length,
    rejected: companies.filter(c => c.status === 'rejected').length,
  };
}

export async function getWeeklyActivity(userId: string, weeks: number = 12): Promise<WeeklyActivityData[]> {
  const { data, error } = await supabase
    .from('companies')
    .select('date_added')
    .eq('user_id', userId)
    .order('date_added', { ascending: true });

  if (error) throw error;

  const companies = (data || []) as { date_added: string }[];

  // Group by week
  const weekMap = new Map<string, number>();
  const now = new Date();
  const startDate = new Date(now.getTime() - weeks * 7 * 24 * 60 * 60 * 1000);

  companies.forEach(company => {
    const date = new Date(company.date_added);
    if (date >= startDate) {
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay()); // Start of week (Sunday)
      const weekKey = weekStart.toISOString().split('T')[0];
      weekMap.set(weekKey, (weekMap.get(weekKey) || 0) + 1);
    }
  });

  // Fill in missing weeks with 0
  const result: WeeklyActivityData[] = [];
  for (let i = weeks - 1; i >= 0; i--) {
    const weekDate = new Date(now.getTime() - i * 7 * 24 * 60 * 60 * 1000);
    weekDate.setDate(weekDate.getDate() - weekDate.getDay());
    const weekKey = weekDate.toISOString().split('T')[0];
    const weekLabel = `Week ${weeks - i}`;
    result.push({
      week: weekLabel,
      count: weekMap.get(weekKey) || 0,
    });
  }

  return result;
}

export async function getCompanyStatusBreakdown(userId: string): Promise<CompanyStatusBreakdown[]> {
  const funnelData = await getApplicationFunnel(userId);
  const total = Object.values(funnelData).reduce((sum, count) => sum + count, 0);

  if (total === 0) {
    return [];
  }

  return [
    { status: 'Researching', count: funnelData.researching, percentage: (funnelData.researching / total) * 100 },
    { status: 'Applied', count: funnelData.applied, percentage: (funnelData.applied / total) * 100 },
    { status: 'Interviewing', count: funnelData.interviewing, percentage: (funnelData.interviewing / total) * 100 },
    { status: 'Offer', count: funnelData.offer, percentage: (funnelData.offer / total) * 100 },
    { status: 'Rejected', count: funnelData.rejected, percentage: (funnelData.rejected / total) * 100 },
  ].filter(item => item.count > 0);
}

export async function getPlanProgress(userId: string): Promise<PlanProgress> {
  // Get all plans for user
  const { data: plans, error: planError } = await supabase
    .from('ninety_day_plans')
    .select('id')
    .eq('user_id', userId);

  if (planError) throw planError;

  if (!plans || plans.length === 0) {
    return {
      totalMilestones: 0,
      completed: 0,
      inProgress: 0,
      notStarted: 0,
      completionPercentage: 0,
    };
  }

  // Get all milestones for these plans
  const planIds = (plans as { id: string }[]).map(p => p.id);
  const { data: milestones, error: milestonesError } = await supabase
    .from('weekly_milestones')
    .select('status')
    .in('plan_id', planIds);

  if (milestonesError) throw milestonesError;

  const allMilestones = milestones || [];
  const completed = allMilestones.filter((m: WeeklyMilestone) => m.status === 'completed').length;
  const inProgress = allMilestones.filter((m: WeeklyMilestone) => m.status === 'in_progress').length;
  const notStarted = allMilestones.filter((m: WeeklyMilestone) => m.status === 'not_started').length;

  return {
    totalMilestones: allMilestones.length,
    completed,
    inProgress,
    notStarted,
    completionPercentage: allMilestones.length > 0 ? (completed / allMilestones.length) * 100 : 0,
  };
}

export async function getCanvasCompletion(userId: string): Promise<CanvasCompletion> {
  const { data, error } = await supabase
    .from('career_canvas')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) throw error;

  if (!data) {
    return {
      sectionsCompleted: 0,
      totalSections: 9,
      completionPercentage: 0,
    };
  }

  const canvas = data as {
    section_1_helpers: string | null;
    section_2_activities: string | null;
    section_3_value: string | null;
    section_4_interactions: string | null;
    section_5_convince: string | null;
    section_6_skills: string | null;
    section_7_motivation: string | null;
    section_8_sacrifices: string | null;
    section_9_outcomes: string | null;
    completion_percentage: number;
  };

  const sections = [
    canvas.section_1_helpers,
    canvas.section_2_activities,
    canvas.section_3_value,
    canvas.section_4_interactions,
    canvas.section_5_convince,
    canvas.section_6_skills,
    canvas.section_7_motivation,
    canvas.section_8_sacrifices,
    canvas.section_9_outcomes,
  ];

  const completed = sections.filter(section => section && section.trim().length > 0).length;

  return {
    sectionsCompleted: completed,
    totalSections: 9,
    completionPercentage: canvas.completion_percentage || 0,
  };
}

export async function getInterviewStats(userId: string): Promise<{ upcoming: number; thisMonth: number }> {
  const { data, error } = await supabase
    .from('companies')
    .select('status, updated_at')
    .eq('user_id', userId)
    .eq('status', 'interviewing');

  if (error) throw error;

  const companies = (data || []) as { status: string; updated_at: string }[];
  const now = new Date();
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const thisMonth = companies.filter(c => {
    const updatedDate = new Date(c.updated_at);
    return updatedDate >= firstDayOfMonth;
  }).length;

  return {
    upcoming: companies.length,
    thisMonth,
  };
}

export async function getOverallStats(userId: string): Promise<OverallStats> {
  const [funnelData, planProgress, canvasData, interviewStats] = await Promise.all([
    getApplicationFunnel(userId),
    getPlanProgress(userId),
    getCanvasCompletion(userId),
    getInterviewStats(userId),
  ]);

  const totalApplications = funnelData.applied + funnelData.interviewing + funnelData.offer;
  const activeCompanies = funnelData.researching + funnelData.applied + funnelData.interviewing;

  return {
    totalApplications,
    interviewsThisWeek: interviewStats.upcoming,
    activeCompanies,
    planProgress: Math.round(planProgress.completionPercentage),
    canvasCompletion: Math.round(canvasData.completionPercentage),
  };
}
