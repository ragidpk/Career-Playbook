import { supabase } from './supabase';
import type { Database } from '../types/database.types';

// Types
export type UserRole = 'job_seeker' | 'mentor' | 'admin' | 'super_admin';
type Profile = Database['public']['Tables']['profiles']['Row'];
type Plan = Database['public']['Tables']['ninety_day_plans']['Row'];

export interface UserWithStats {
  id: string;
  email: string;
  full_name: string | null;
  role: UserRole;
  is_admin: boolean;
  created_at: string;
  updated_at: string;
  plan_count: number;
  resume_count: number;
  company_count: number;
  canvas_count: number;
}

export interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  totalPlans: number;
  totalResumes: number;
  usersByRole: Record<UserRole, number>;
  recentSignups: number;
}

export interface PlanWithUser {
  id: string;
  title: string;
  start_date: string;
  end_date: string;
  created_at: string;
  user_id: string;
  user_email: string;
  user_name: string | null;
  milestone_count: number;
  completed_milestones: number;
}

// Check if current user is admin
export async function checkIsAdmin(): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (error || !data) return false;

  const profile = data as Profile;
  return profile.role === 'admin' || profile.role === 'super_admin' || profile.is_admin === true;
}

// Check if current user is super admin
export async function checkIsSuperAdmin(): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (error || !data) return false;

  const profile = data as Profile;
  return profile.role === 'super_admin';
}

// View type for admin_user_stats
interface AdminUserStatsRow {
  id: string;
  email: string;
  full_name: string | null;
  role: string;
  is_admin: boolean;
  created_at: string;
  updated_at: string;
  plan_count: number;
  resume_count: number;
  company_count: number;
  canvas_count: number;
}

// Get all users with stats - OPTIMIZED using admin_user_stats view
// TODO: Remove fallback functions once all environments have migration 20250112000010 applied
export async function getAllUsers(): Promise<UserWithStats[]> {
  // Use the optimized view that does JOINs instead of N+1 queries
  const { data, error } = await supabase
    .from('admin_user_stats')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    // Fallback to direct query if view doesn't exist yet (42P01 = relation does not exist)
    if (error.code === '42P01') {
      console.warn('admin_user_stats view not found, using fallback N+1 queries');
      return getAllUsersFallback();
    }
    throw error;
  }

  const rows = (data || []) as AdminUserStatsRow[];
  return rows.map((user) => ({
    id: user.id,
    email: user.email,
    full_name: user.full_name,
    role: user.role as UserRole,
    is_admin: user.is_admin || false,
    created_at: user.created_at,
    updated_at: user.updated_at,
    plan_count: user.plan_count || 0,
    resume_count: user.resume_count || 0,
    company_count: user.company_count || 0,
    canvas_count: user.canvas_count || 0,
  }));
}

// Fallback for getAllUsers if view doesn't exist
async function getAllUsersFallback(): Promise<UserWithStats[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;

  const profiles = (data || []) as Profile[];

  // Get stats for each user (N+1, but only used as fallback)
  const usersWithStats = await Promise.all(
    profiles.map(async (user) => {
      const [plans, resumes, companies, canvas] = await Promise.all([
        supabase.from('ninety_day_plans').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase.from('resume_analyses').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase.from('companies').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase.from('career_canvas').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
      ]);

      return {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        role: user.role as UserRole,
        is_admin: user.is_admin || false,
        created_at: user.created_at,
        updated_at: user.updated_at,
        plan_count: plans.count || 0,
        resume_count: resumes.count || 0,
        company_count: companies.count || 0,
        canvas_count: canvas.count || 0,
      };
    })
  );

  return usersWithStats;
}

// View type for admin_plans_with_users
interface AdminPlansWithUsersRow {
  id: string;
  title: string;
  start_date: string;
  end_date: string;
  created_at: string;
  user_id: string;
  user_email: string;
  user_name: string | null;
  milestone_count: number;
  completed_milestones: number;
}

// Get admin dashboard stats - OPTIMIZED using RPC function
// TODO: Remove fallback once all environments have migration 20250112000010 applied
export async function getAdminStats(): Promise<AdminStats> {
  // Try optimized RPC function first
  const { data: rpcData, error: rpcError } = await supabase.rpc('get_admin_dashboard_stats');

  if (!rpcError && rpcData) {
    const stats = rpcData as {
      totalUsers: number;
      totalPlans: number;
      totalResumes: number;
      recentSignups: number;
      usersByRole: Record<string, number>;
    };

    // Ensure all roles have a count (default to 0)
    const usersByRole: Record<UserRole, number> = {
      job_seeker: stats.usersByRole?.job_seeker || 0,
      mentor: stats.usersByRole?.mentor || 0,
      admin: stats.usersByRole?.admin || 0,
      super_admin: stats.usersByRole?.super_admin || 0,
    };

    return {
      totalUsers: stats.totalUsers || 0,
      activeUsers: stats.totalUsers || 0,
      totalPlans: stats.totalPlans || 0,
      totalResumes: stats.totalResumes || 0,
      usersByRole,
      recentSignups: stats.recentSignups || 0,
    };
  }

  // Fallback to direct queries if RPC doesn't exist
  return getAdminStatsFallback();
}

// Fallback for getAdminStats if RPC doesn't exist
async function getAdminStatsFallback(): Promise<AdminStats> {
  // Single query to get all profile stats
  const { data: profilesData, error: profilesError } = await supabase
    .from('profiles')
    .select('role, created_at');

  if (profilesError) throw profilesError;

  const profiles = (profilesData || []) as { role: string; created_at: string }[];

  // Parallel count queries
  const [planResult, resumeResult] = await Promise.all([
    supabase.from('ninety_day_plans').select('id', { count: 'exact', head: true }),
    supabase.from('resume_analyses').select('id', { count: 'exact', head: true }),
  ]);

  // Calculate stats from profiles array
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const usersByRole: Record<UserRole, number> = {
    job_seeker: 0,
    mentor: 0,
    admin: 0,
    super_admin: 0,
  };

  let recentSignups = 0;

  profiles.forEach((profile) => {
    const role = profile.role as UserRole;
    usersByRole[role] = (usersByRole[role] || 0) + 1;

    if (new Date(profile.created_at) >= sevenDaysAgo) {
      recentSignups++;
    }
  });

  return {
    totalUsers: profiles.length,
    activeUsers: profiles.length,
    totalPlans: planResult.count || 0,
    totalResumes: resumeResult.count || 0,
    usersByRole,
    recentSignups,
  };
}

// Get all plans with user info - OPTIMIZED using admin_plans_with_users view
// TODO: Remove fallback once all environments have migration 20250112000010 applied
export async function getAllPlans(): Promise<PlanWithUser[]> {
  // Use the optimized view that does JOINs instead of N+1 queries
  const { data, error } = await supabase
    .from('admin_plans_with_users')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    // Fallback to direct query if view doesn't exist yet (42P01 = relation does not exist)
    if (error.code === '42P01') {
      console.warn('admin_plans_with_users view not found, using fallback N+1 queries');
      return getAllPlansFallback();
    }
    throw error;
  }

  const rows = (data || []) as AdminPlansWithUsersRow[];
  return rows.map((plan) => ({
    id: plan.id,
    title: plan.title,
    start_date: plan.start_date,
    end_date: plan.end_date,
    created_at: plan.created_at,
    user_id: plan.user_id,
    user_email: plan.user_email || 'Unknown',
    user_name: plan.user_name || null,
    milestone_count: plan.milestone_count || 0,
    completed_milestones: plan.completed_milestones || 0,
  }));
}

// Fallback for getAllPlans if view doesn't exist
async function getAllPlansFallback(): Promise<PlanWithUser[]> {
  const { data: plansData, error: plansError } = await supabase
    .from('ninety_day_plans')
    .select('*')
    .order('created_at', { ascending: false });

  if (plansError) throw plansError;

  const plans = (plansData || []) as Plan[];

  // Get user info and milestone counts for each plan (N+1, but only used as fallback)
  const plansWithUsers = await Promise.all(
    plans.map(async (plan) => {
      const [userResult, milestonesResult] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', plan.user_id).single(),
        supabase.from('weekly_milestones').select('*').eq('plan_id', plan.id),
      ]);

      const userProfile = userResult.data as Profile | null;
      const milestones = (milestonesResult.data || []) as { id: string; status: string }[];
      const completedMilestones = milestones.filter((m) => m.status === 'completed').length;

      return {
        id: plan.id,
        title: plan.title,
        start_date: plan.start_date,
        end_date: plan.end_date,
        created_at: plan.created_at,
        user_id: plan.user_id,
        user_email: userProfile?.email || 'Unknown',
        user_name: userProfile?.full_name || null,
        milestone_count: milestones.length,
        completed_milestones: completedMilestones,
      };
    })
  );

  return plansWithUsers;
}

// Update user role (super admin only)
export async function updateUserRole(userId: string, role: UserRole): Promise<void> {
  const isSuperAdmin = await checkIsSuperAdmin();
  if (!isSuperAdmin) {
    throw new Error('Only super admins can change user roles');
  }

  // Get current user to prevent self-modification
  const { data: { user } } = await supabase.auth.getUser();
  if (user?.id === userId) {
    throw new Error('Cannot change your own role');
  }

  const isAdmin = role === 'admin' || role === 'super_admin';

  const { error } = await supabase
    .from('profiles')
    // @ts-expect-error - Supabase typing issue with profile updates
    .update({ role, is_admin: isAdmin })
    .eq('id', userId);

  if (error) throw error;
}

// Get user details
export async function getUserDetails(userId: string): Promise<UserWithStats | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error || !data) return null;

  const profile = data as Profile;

  const [plans, resumes, companies, canvas] = await Promise.all([
    supabase.from('ninety_day_plans').select('id', { count: 'exact', head: true }).eq('user_id', userId),
    supabase.from('resume_analyses').select('id', { count: 'exact', head: true }).eq('user_id', userId),
    supabase.from('companies').select('id', { count: 'exact', head: true }).eq('user_id', userId),
    supabase.from('career_canvas').select('id', { count: 'exact', head: true }).eq('user_id', userId),
  ]);

  return {
    id: profile.id,
    email: profile.email,
    full_name: profile.full_name,
    role: profile.role as UserRole,
    is_admin: profile.is_admin || false,
    created_at: profile.created_at,
    updated_at: profile.updated_at,
    plan_count: plans.count || 0,
    resume_count: resumes.count || 0,
    company_count: companies.count || 0,
    canvas_count: canvas.count || 0,
  };
}
