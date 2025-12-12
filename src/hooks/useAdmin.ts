import { useState, useEffect, useCallback } from 'react';
import {
  checkIsAdmin,
  checkIsSuperAdmin,
  getAllUsers,
  getAdminStats,
  getAllPlans,
  updateUserRole,
  type UserWithStats,
  type AdminStats,
  type PlanWithUser,
  type UserRole,
} from '../services/admin.service';

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

  return { users, isLoading, error, refresh: loadUsers, changeRole };
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
