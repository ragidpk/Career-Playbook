import { supabase } from './supabase';
import type { Database } from '../types/database.types';

type NinetyDayPlan = Database['public']['Tables']['ninety_day_plans']['Row'];
type WeeklyMilestone = Database['public']['Tables']['weekly_milestones']['Row'];
type CreatePlanInput = Database['public']['Tables']['ninety_day_plans']['Insert'];
type UpdateMilestoneInput = Database['public']['Tables']['weekly_milestones']['Update'];

export interface PlanWithMilestones extends NinetyDayPlan {
  weekly_milestones: WeeklyMilestone[];
}

const MAX_GOAL_LENGTH = 200;

export async function getPlans(userId: string): Promise<PlanWithMilestones[]> {
  const { data, error } = await supabase
    .from('ninety_day_plans')
    .select('*, weekly_milestones(*)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;

  // Sort milestones by order_index for each plan
  const result = (data || []).map((plan: any) => ({
    ...plan,
    weekly_milestones: (plan.weekly_milestones || []).sort(
      (a: any, b: any) => a.order_index - b.order_index
    )
  }));

  return result as PlanWithMilestones[];
}

export async function getPlan(planId: string): Promise<PlanWithMilestones> {
  const { data, error } = await supabase
    .from('ninety_day_plans')
    .select('*, weekly_milestones(*)')
    .eq('id', planId)
    .single();

  if (error) throw error;

  // Sort milestones by order_index
  const result = {
    ...(data as any),
    weekly_milestones: ((data as any).weekly_milestones || []).sort(
      (a: any, b: any) => a.order_index - b.order_index
    )
  };

  return result as PlanWithMilestones;
}

export async function createPlan(userId: string, plan: Omit<CreatePlanInput, 'user_id'>): Promise<NinetyDayPlan> {
  const { data: planData, error: planError } = await supabase
    .from('ninety_day_plans')
    .insert({ user_id: userId, ...plan } as any)
    .select()
    .single();

  if (planError) throw planError;

  const resultPlan = planData as any;

  // Create 12 weekly milestones
  const milestones = Array.from({ length: 12 }, (_, i) => ({
    plan_id: resultPlan.id,
    week_number: i + 1,
    goal: '',
    status: 'not_started' as const,
    order_index: i,
  }));

  const { error: milestonesError } = await supabase
    .from('weekly_milestones')
    .insert(milestones as any);

  if (milestonesError) throw milestonesError;

  return resultPlan as NinetyDayPlan;
}

export async function updateMilestone(
  milestoneId: string,
  updates: Partial<UpdateMilestoneInput>
): Promise<WeeklyMilestone> {
  // Enforce 200-char limit on goal field
  if (updates.goal && updates.goal.length > MAX_GOAL_LENGTH) {
    throw new Error(`Goal must be ${MAX_GOAL_LENGTH} characters or less`);
  }

  const { data, error } = await supabase
    .from('weekly_milestones')
    // @ts-expect-error - Supabase typing issue
    .update(updates)
    .eq('id', milestoneId)
    .select()
    .single();

  if (error) throw error;
  return data as WeeklyMilestone;
}

export async function reorderMilestones(
  milestones: { id: string; order_index: number }[]
): Promise<void> {
  // Use atomic RPC function to update all milestones in a single transaction
  // This prevents race conditions from Promise.all with multiple updates
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.rpc as any)('reorder_milestones', {
    milestone_updates: milestones,
  });

  if (error) {
    // Fallback to Promise.all if RPC not available (e.g., migration not run)
    if (error.code === 'PGRST202' || error.message.includes('not found')) {
      console.warn('reorder_milestones RPC not found, using fallback');
      const promises = milestones.map(({ id, order_index }) =>
        supabase
          .from('weekly_milestones')
          // @ts-expect-error - Supabase typing issue
          .update({ order_index })
          .eq('id', id)
      );

      const results = await Promise.all(promises);
      const errors = results.filter(r => r.error);
      if (errors.length > 0) {
        throw new Error(`Failed to reorder milestones: ${errors[0].error?.message}`);
      }
      return;
    }
    throw new Error(`Failed to reorder milestones: ${error.message}`);
  }
}

export async function updatePlan(
  planId: string,
  updates: { title?: string; start_date?: string; end_date?: string }
): Promise<NinetyDayPlan> {
  const { data, error } = await supabase
    .from('ninety_day_plans')
    // @ts-expect-error - Supabase typing issue
    .update(updates)
    .eq('id', planId)
    .select()
    .single();

  if (error) throw error;
  return data as NinetyDayPlan;
}

export async function deletePlan(planId: string): Promise<void> {
  // Delete milestones first (cascade should handle this, but being explicit)
  const { error: milestonesError } = await supabase
    .from('weekly_milestones')
    .delete()
    .eq('plan_id', planId);

  if (milestonesError) throw milestonesError;

  // Delete the plan
  const { error: planError } = await supabase
    .from('ninety_day_plans')
    .delete()
    .eq('id', planId);

  if (planError) throw planError;
}

// Note: Status enum values match DB constraint: 'not_started' | 'in_progress' | 'completed'
// Week numbers are unique per plan (enforced by DB constraint: unique_plan_week)

export interface CareerCanvasData {
  section_1_helpers?: string | null;
  section_2_activities?: string | null;
  section_3_value?: string | null;
  section_4_interactions?: string | null;
  section_5_convince?: string | null;
  section_6_skills?: string | null;
  section_7_motivation?: string | null;
  section_8_sacrifices?: string | null;
  section_9_outcomes?: string | null;
}

export async function generateAIMilestones(
  planId: string,
  canvasData: CareerCanvasData
): Promise<{ success: boolean; message: string }> {
  const { data: { session } } = await supabase.auth.getSession();

  if (!session?.access_token) {
    throw new Error('Not authenticated');
  }

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;

  const response = await fetch(`${supabaseUrl}/functions/v1/generate-milestones`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({ planId, canvasData }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Failed to generate milestones');
  }

  return data;
}
