import { useState, useEffect, useCallback } from 'react';
import {
  checkIsAdmin,
  checkIsSuperAdmin,
  getAllUsers,
  getAdminStats,
  getAllPlans,
  updateUserRole,
  updateUserResumeLimit,
  updateUser,
  deleteUser,
  getAllMentors,
  getAllMentorInvitations,
  getAccountabilityPartners,
  updateUserRoles,
  sendPasswordResetEmail,
  type UserWithStats,
  type AdminStats,
  type PlanWithUser,
  type UserRole,
  type UserEditData,
  type MentorWithMentees,
  type MentorInvitationAdmin,
} from '../services/admin.service';
import {
  getTemplates,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  duplicateTemplate,
} from '../services/template.service';
import type { CareerPlanTemplate } from '../types/database.types';

// Hook to check if current user is admin
export function useIsAdmin() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function check() {
      try {
        const [adminStatus, superAdminStatus] = await Promise.all([
          checkIsAdmin(),
          checkIsSuperAdmin(),
        ]);
        setIsAdmin(adminStatus);
        setIsSuperAdmin(superAdminStatus);
      } catch {
        setIsAdmin(false);
        setIsSuperAdmin(false);
      } finally {
        setIsLoading(false);
      }
    }
    check();
  }, []);

  return { isAdmin, isSuperAdmin, isLoading };
}

// Hook to get all users
export function useAdminUsers() {
  const [users, setUsers] = useState<UserWithStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadUsers = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getAllUsers();
      setUsers(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load users');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const changeRole = async (userId: string, role: UserRole) => {
    await updateUserRole(userId, role);
    await loadUsers(); // Refresh the list
  };

  const changeResumeLimit = async (userId: string, limit: number) => {
    await updateUserResumeLimit(userId, limit);
    await loadUsers(); // Refresh the list
  };

  const editUser = async (userId: string, data: UserEditData) => {
    await updateUser(userId, data);
    await loadUsers(); // Refresh the list
  };

  const removeUser = async (userId: string) => {
    await deleteUser(userId);
    await loadUsers(); // Refresh the list
  };

  const changeRoles = async (userId: string, roles: UserRole[]) => {
    await updateUserRoles(userId, roles);
    await loadUsers(); // Refresh the list
  };

  const sendPasswordReset = async (email: string) => {
    await sendPasswordResetEmail(email);
  };

  return { users, isLoading, error, refresh: loadUsers, changeRole, changeRoles, changeResumeLimit, editUser, removeUser, sendPasswordReset };
}

// Hook to get admin stats
export function useAdminStats() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadStats = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getAdminStats();
      setStats(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load stats');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  return { stats, isLoading, error, refresh: loadStats };
}

// Hook to get all plans
export function useAdminPlans() {
  const [plans, setPlans] = useState<PlanWithUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadPlans = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getAllPlans();
      setPlans(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load plans');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPlans();
  }, [loadPlans]);

  return { plans, isLoading, error, refresh: loadPlans };
}

// Hook to get all mentors with their mentees
export function useAdminMentors() {
  const [mentors, setMentors] = useState<MentorWithMentees[]>([]);
  const [invitations, setInvitations] = useState<MentorInvitationAdmin[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadMentors = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [mentorData, invitationData] = await Promise.all([
        getAllMentors(),
        getAllMentorInvitations(),
      ]);
      setMentors(mentorData);
      setInvitations(invitationData);
    } catch (err: unknown) {
      // Log detailed error for debugging RLS issues
      const error = err as { code?: string; message?: string; details?: string; hint?: string };
      console.error('[useAdminMentors] Error loading mentors:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
        raw: err,
      });
      setError(error.message || 'Failed to load mentors');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMentors();
  }, [loadMentors]);

  return { mentors, invitations, isLoading, error, refresh: loadMentors };
}

// Hook to get accountability partners
export function useAdminPartners() {
  const [partners, setPartners] = useState<MentorWithMentees[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadPartners = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getAccountabilityPartners();
      setPartners(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load partners');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPartners();
  }, [loadPartners]);

  return { partners, isLoading, error, refresh: loadPartners };
}

// Hook to manage templates
export function useAdminTemplates() {
  const [templates, setTemplates] = useState<CareerPlanTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadTemplates = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getTemplates();
      setTemplates(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load templates');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTemplates();
  }, [loadTemplates]);

  const create = async (template: Omit<CareerPlanTemplate, 'id' | 'created_at' | 'updated_at'>) => {
    await createTemplate(template);
    await loadTemplates();
  };

  const update = async (id: string, updates: Partial<CareerPlanTemplate>) => {
    await updateTemplate(id, updates);
    await loadTemplates();
  };

  const remove = async (id: string) => {
    await deleteTemplate(id);
    await loadTemplates();
  };

  const duplicate = async (id: string) => {
    await duplicateTemplate(id);
    await loadTemplates();
  };

  return {
    templates,
    isLoading,
    error,
    refresh: loadTemplates,
    create,
    update,
    remove,
    duplicate,
  };
}
