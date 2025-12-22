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
  roles: UserRole[]; // Multiple roles support
  is_admin: boolean;
  created_at: string;
  updated_at: string;
  plan_count: number;
  resume_count: number;
  company_count: number;
  canvas_count: number;
  resume_analysis_limit: number;
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
  roles: string[] | null; // Multiple roles from user_roles table
  is_admin: boolean;
  created_at: string;
  updated_at: string;
  plan_count: number;
  resume_count: number;
  company_count: number;
  canvas_count: number;
  resume_analysis_limit: number | null;
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
    roles: (user.roles || [user.role]).filter(Boolean) as UserRole[],
    is_admin: user.is_admin || false,
    created_at: user.created_at,
    updated_at: user.updated_at,
    plan_count: user.plan_count || 0,
    resume_count: user.resume_count || 0,
    company_count: user.company_count || 0,
    canvas_count: user.canvas_count || 0,
    resume_analysis_limit: user.resume_analysis_limit ?? 2,
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
        roles: [user.role as UserRole], // Fallback uses single role
        is_admin: user.is_admin || false,
        created_at: user.created_at,
        updated_at: user.updated_at,
        plan_count: plans.count || 0,
        resume_count: resumes.count || 0,
        company_count: companies.count || 0,
        canvas_count: canvas.count || 0,
        resume_analysis_limit: user.resume_analysis_limit ?? 2,
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

// Update user's resume analysis limit (admin only)
export async function updateUserResumeLimit(userId: string, limit: number): Promise<void> {
  const isAdmin = await checkIsAdmin();
  if (!isAdmin) {
    throw new Error('Only admins can change user limits');
  }

  const { error } = await supabase
    .from('profiles')
    // @ts-expect-error - Supabase typing issue with profile updates
    .update({ resume_analysis_limit: limit })
    .eq('id', userId);

  if (error) throw error;
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
    roles: [profile.role as UserRole], // Fallback to single role
    is_admin: profile.is_admin || false,
    created_at: profile.created_at,
    updated_at: profile.updated_at,
    plan_count: plans.count || 0,
    resume_count: resumes.count || 0,
    company_count: companies.count || 0,
    canvas_count: canvas.count || 0,
    resume_analysis_limit: profile.resume_analysis_limit ?? 2,
  };
}

// User edit data interface
export interface UserEditData {
  full_name?: string | null;
  email?: string;
  role?: UserRole;
  resume_analysis_limit?: number;
}

// Update user details (super admin only)
export async function updateUser(userId: string, data: UserEditData): Promise<void> {
  const isSuperAdmin = await checkIsSuperAdmin();
  if (!isSuperAdmin) {
    throw new Error('Only super admins can edit users');
  }

  // Get current user to prevent self-modification of role
  const { data: { user } } = await supabase.auth.getUser();
  if (user?.id === userId && data.role) {
    throw new Error('Cannot change your own role');
  }

  const updateData: Record<string, unknown> = { ...data };

  // Set is_admin based on role if role is being changed
  if (data.role) {
    updateData.is_admin = data.role === 'admin' || data.role === 'super_admin';
  }

  const { error } = await supabase
    .from('profiles')
    // @ts-expect-error - Supabase typing issue with profile updates
    .update(updateData)
    .eq('id', userId);

  if (error) throw error;
}

// Delete user and all their data (super admin only)
export async function deleteUser(userId: string): Promise<void> {
  const isSuperAdmin = await checkIsSuperAdmin();
  if (!isSuperAdmin) {
    throw new Error('Only super admins can delete users');
  }

  // Get current user to prevent self-deletion
  const { data: { user } } = await supabase.auth.getUser();
  if (user?.id === userId) {
    throw new Error('Cannot delete your own account');
  }

  // Get user's email for mentor_invitations cleanup
  const { data: userProfile } = await supabase
    .from('profiles')
    .select('email')
    .eq('id', userId)
    .single();

  const userEmail = (userProfile as { email: string } | null)?.email;

  // Get user's plan IDs for milestone cleanup
  const { data: userPlans } = await supabase
    .from('ninety_day_plans')
    .select('id')
    .eq('user_id', userId);

  const planIds = ((userPlans || []) as { id: string }[]).map((p) => p.id);

  // Delete milestones for user's plans (if any plans exist)
  if (planIds.length > 0) {
    try {
      await supabase.from('weekly_milestones').delete().in('plan_id', planIds);
    } catch {
      // Continue even if delete fails
    }
  }

  // Delete user's data from tables (order matters for foreign keys)
  const directDeletes = [
    supabase.from('ninety_day_plans').delete().eq('user_id', userId),
    supabase.from('resume_analyses').delete().eq('user_id', userId),
    supabase.from('companies').delete().eq('user_id', userId),
    supabase.from('career_canvas').delete().eq('user_id', userId),
    supabase.from('ai_usage_tracking').delete().eq('user_id', userId),
    supabase.from('mentor_invitations').delete().eq('job_seeker_id', userId),
    supabase.from('mentorship_sessions').delete().eq('host_id', userId),
    supabase.from('mentorship_sessions').delete().eq('attendee_id', userId),
    supabase.from('calendar_connections').delete().eq('user_id', userId),
    supabase.from('session_reminders').delete().eq('user_id', userId),
  ];

  // Execute direct delete operations
  for (const op of directDeletes) {
    try {
      await op;
    } catch {
      // Continue even if some deletes fail (table might not exist or be empty)
    }
  }

  // Delete mentor_invitations where this user was invited as mentor (by email)
  if (userEmail) {
    try {
      await supabase.from('mentor_invitations').delete().eq('mentor_email', userEmail);
    } catch {
      // Continue even if delete fails
    }
  }

  // Delete the profile
  const { error: profileError } = await supabase
    .from('profiles')
    .delete()
    .eq('id', userId);

  if (profileError) throw profileError;

  // Note: The auth.users entry should be deleted via Supabase Admin API or trigger
  // For now, the profile is deleted which effectively disables the account
}

// ============ MENTOR & ACCOUNTABILITY PARTNER FUNCTIONS ============

export interface MentorWithMentees {
  id: string;
  email: string;
  full_name: string | null;
  role: UserRole;
  created_at: string;
  mentees: {
    id: string;
    email: string;
    full_name: string | null;
    status: string;
    connected_at: string;
  }[];
}

export interface MentorInvitationAdmin {
  id: string;
  job_seeker_id: string;
  job_seeker_email: string;
  job_seeker_name: string | null;
  mentor_email: string;
  mentor_id: string | null;
  mentor_name: string | null;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
}

// Get all mentors with their mentees (based on mentor_access table)
export async function getAllMentors(): Promise<MentorWithMentees[]> {
  // Get mentor access records to find all active mentors
  const { data: accessRecords, error: accessError } = await supabase
    .from('mentor_access')
    .select('*');

  if (accessError) {
    if (accessError.code === '42P01') {
      return []; // Table doesn't exist
    }
    throw accessError;
  }

  if (!accessRecords || accessRecords.length === 0) {
    return [];
  }

  // Get unique mentor IDs from mentor_access table
  const mentorIds = [...new Set((accessRecords || []).map((r: any) => r.mentor_id))];

  // Get mentor profiles
  const { data: mentorsData, error: mentorError } = await supabase
    .from('profiles')
    .select('id, email, full_name, role, created_at')
    .in('id', mentorIds)
    .order('created_at', { ascending: false });

  if (mentorError) throw mentorError;

  const mentors = (mentorsData || []) as Array<{
    id: string;
    email: string;
    full_name: string | null;
    role: string;
    created_at: string;
  }>;

  // Get job seeker profiles for mentees
  const jobSeekerIds = [...new Set((accessRecords || []).map((r: any) => r.job_seeker_id))];
  const { data: jobSeekerProfiles } = await supabase
    .from('profiles')
    .select('id, email, full_name')
    .in('id', jobSeekerIds.length > 0 ? jobSeekerIds : ['none']);

  const jobSeekerMap = new Map(
    (jobSeekerProfiles || []).map((p: any) => [p.id, p])
  );

  // Map mentors with their mentees
  const mentorsWithMentees: MentorWithMentees[] = mentors.map((mentor) => {
    const mentorAccess = (accessRecords || []).filter(
      (record: any) => record.mentor_id === mentor.id
    );

    const mentees = mentorAccess.map((access: any) => {
      const profile = jobSeekerMap.get(access.job_seeker_id);
      return {
        id: access.job_seeker_id,
        email: profile?.email || 'Unknown',
        full_name: profile?.full_name || null,
        status: 'connected',
        connected_at: access.created_at,
      };
    });

    return {
      id: mentor.id,
      email: mentor.email,
      full_name: mentor.full_name,
      role: mentor.role as UserRole,
      created_at: mentor.created_at,
      mentees,
    };
  });

  return mentorsWithMentees;
}

// Get all mentor invitations for admin view
export async function getAllMentorInvitations(): Promise<MentorInvitationAdmin[]> {
  const { data, error } = await supabase
    .from('mentor_invitations')
    .select(`
      id,
      job_seeker_id,
      mentor_email,
      status,
      invited_at,
      profiles!mentor_invitations_job_seeker_id_fkey (
        email,
        full_name
      )
    `)
    .order('invited_at', { ascending: false });

  if (error) throw error;

  // Get mentor profiles for accepted invitations
  const mentorEmails = [...new Set((data || []).map((inv: any) => inv.mentor_email))];
  const { data: mentorProfiles } = await supabase
    .from('profiles')
    .select('id, email, full_name')
    .in('email', mentorEmails);

  const mentorMap = new Map(
    (mentorProfiles || []).map((p: any) => [p.email, { id: p.id, full_name: p.full_name }])
  );

  return (data || []).map((inv: any) => {
    const mentorInfo = mentorMap.get(inv.mentor_email);
    return {
      id: inv.id,
      job_seeker_id: inv.job_seeker_id,
      job_seeker_email: inv.profiles?.email || 'Unknown',
      job_seeker_name: inv.profiles?.full_name || null,
      mentor_email: inv.mentor_email,
      mentor_id: mentorInfo?.id || null,
      mentor_name: mentorInfo?.full_name || null,
      status: inv.status,
      created_at: inv.invited_at,
    };
  });
}

// Get accountability partners (users who are mentoring others)
export async function getAccountabilityPartners(): Promise<MentorWithMentees[]> {
  // Get all mentor access records grouped by mentor
  const { data: accessRecords, error: accessError } = await supabase
    .from('mentor_access')
    .select(`
      mentor_id,
      job_seeker_id,
      created_at,
      permission_level
    `);

  if (accessError) {
    if (accessError.code === '42P01') {
      return []; // Table doesn't exist
    }
    throw accessError;
  }

  // Get unique mentor IDs
  const mentorIds = [...new Set((accessRecords || []).map((r: any) => r.mentor_id))];

  if (mentorIds.length === 0) return [];

  // Get mentor profiles
  const { data: mentorProfiles, error: profileError } = await supabase
    .from('profiles')
    .select('id, email, full_name, role, created_at')
    .in('id', mentorIds);

  if (profileError) throw profileError;

  // Get all job seeker profiles for the mentees
  const jobSeekerIds = [...new Set((accessRecords || []).map((r: any) => r.job_seeker_id))];
  const { data: jobSeekerProfiles } = await supabase
    .from('profiles')
    .select('id, email, full_name')
    .in('id', jobSeekerIds);

  const jobSeekerMap = new Map(
    (jobSeekerProfiles || []).map((p: any) => [p.id, p])
  );

  // Build the partners list
  return (mentorProfiles || []).map((mentor: any) => {
    const menteeRecords = (accessRecords || []).filter(
      (r: any) => r.mentor_id === mentor.id
    );

    const mentees = menteeRecords.map((record: any) => {
      const profile = jobSeekerMap.get(record.job_seeker_id);
      return {
        id: record.job_seeker_id,
        email: profile?.email || 'Unknown',
        full_name: profile?.full_name || null,
        status: 'active',
        connected_at: record.created_at,
      };
    });

    return {
      id: mentor.id,
      email: mentor.email,
      full_name: mentor.full_name,
      role: mentor.role as UserRole,
      created_at: mentor.created_at,
      mentees,
    };
  });
}

// ============ MULTI-ROLE MANAGEMENT FUNCTIONS ============

// Get user's roles from user_roles table
export async function getUserRoles(userId: string): Promise<UserRole[]> {
  const { data, error } = await supabase
    .from('user_roles' as 'profiles') // Type hack for untyped table
    .select('role')
    .eq('user_id' as 'id', userId)
    .order('assigned_at' as 'created_at', { ascending: true });

  if (error) {
    // Fallback to profile role if table doesn't exist
    if (error.code === '42P01') {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single();
      return profile ? [(profile as { role: string }).role as UserRole] : [];
    }
    throw error;
  }

  return ((data || []) as unknown as { role: string }[]).map((r) => r.role as UserRole);
}

// Add role to user (super admin only)
export async function addUserRole(userId: string, role: UserRole): Promise<void> {
  const isSuperAdmin = await checkIsSuperAdmin();
  if (!isSuperAdmin) {
    throw new Error('Only super admins can assign roles');
  }

  const { data: { user } } = await supabase.auth.getUser();

  const { error } = await (supabase
    .from('user_roles' as 'profiles') as unknown as { insert: (data: Record<string, unknown>) => Promise<{ error: { code?: string; message: string } | null }> })
    .insert({
      user_id: userId,
      role: role,
      assigned_by: user?.id,
    });

  if (error) {
    if (error.code === '23505') {
      throw new Error('User already has this role');
    }
    throw error;
  }

  // Update primary role and is_admin flag if needed
  const isAdmin = role === 'admin' || role === 'super_admin';
  if (isAdmin) {
    await supabase
      .from('profiles')
      // @ts-expect-error - Supabase typing issue
      .update({ is_admin: true })
      .eq('id', userId);
  }
}

// Remove role from user (super admin only)
export async function removeUserRole(userId: string, role: UserRole): Promise<void> {
  const isSuperAdmin = await checkIsSuperAdmin();
  if (!isSuperAdmin) {
    throw new Error('Only super admins can remove roles');
  }

  // Prevent removing the last role
  const currentRoles = await getUserRoles(userId);
  if (currentRoles.length <= 1) {
    throw new Error('Cannot remove the last role. User must have at least one role.');
  }

  // Prevent super admin from removing their own super_admin role
  const { data: { user } } = await supabase.auth.getUser();
  if (user?.id === userId && role === 'super_admin') {
    throw new Error('Cannot remove your own super admin role');
  }

  const { error } = await supabase
    .from('user_roles' as 'profiles')
    .delete()
    .eq('user_id' as 'id', userId)
    .eq('role' as 'email', role);

  if (error) throw error;

  // Update is_admin flag if no admin roles remain
  const remainingRoles = currentRoles.filter(r => r !== role);
  const hasAdminRole = remainingRoles.some(r => r === 'admin' || r === 'super_admin');

  if (!hasAdminRole) {
    await supabase
      .from('profiles')
      // @ts-expect-error - Supabase typing issue
      .update({ is_admin: false })
      .eq('id', userId);
  }

  // Update primary role to highest remaining role
  const roleHierarchy: UserRole[] = ['super_admin', 'admin', 'mentor', 'job_seeker'];
  const newPrimaryRole = roleHierarchy.find(r => remainingRoles.includes(r)) || 'job_seeker';

  await supabase
    .from('profiles')
    // @ts-expect-error - Supabase typing issue
    .update({ role: newPrimaryRole })
    .eq('id', userId);
}

// Update all roles for a user (super admin only)
export async function updateUserRoles(userId: string, roles: UserRole[]): Promise<void> {
  const isSuperAdmin = await checkIsSuperAdmin();
  if (!isSuperAdmin) {
    throw new Error('Only super admins can manage roles');
  }

  if (roles.length === 0) {
    throw new Error('User must have at least one role');
  }

  // Prevent super admin from removing their own super_admin role
  const { data: { user } } = await supabase.auth.getUser();
  if (user?.id === userId) {
    const currentRoles = await getUserRoles(userId);
    if (currentRoles.includes('super_admin') && !roles.includes('super_admin')) {
      throw new Error('Cannot remove your own super admin role');
    }
  }

  // Delete existing roles
  await supabase
    .from('user_roles' as 'profiles')
    .delete()
    .eq('user_id' as 'id', userId);

  // Insert new roles
  const { error } = await (supabase
    .from('user_roles' as 'profiles') as unknown as { insert: (data: Record<string, unknown>[]) => Promise<{ error: { code?: string; message: string } | null }> })
    .insert(roles.map(role => ({
      user_id: userId,
      role: role,
      assigned_by: user?.id,
    })));

  if (error) throw error;

  // Update profile with primary role and is_admin flag
  const roleHierarchy: UserRole[] = ['super_admin', 'admin', 'mentor', 'job_seeker'];
  const primaryRole = roleHierarchy.find(r => roles.includes(r)) || 'job_seeker';
  const isAdmin = roles.includes('admin') || roles.includes('super_admin');

  await supabase
    .from('profiles')
    // @ts-expect-error - Supabase typing issue
    .update({ role: primaryRole, is_admin: isAdmin })
    .eq('id', userId);
}

// ============ PASSWORD RESET FUNCTIONS ============

// Send password reset email to user (super admin only)
export async function sendPasswordResetEmail(email: string): Promise<void> {
  const isSuperAdmin = await checkIsSuperAdmin();
  if (!isSuperAdmin) {
    throw new Error('Only super admins can send password reset emails');
  }

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`,
  });

  if (error) throw error;
}
