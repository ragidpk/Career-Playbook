import { supabase } from './supabase';
import type { Database } from '../types/database.types';

type Company = Database['public']['Tables']['companies']['Row'];
type CreateCompanyInput = Database['public']['Tables']['companies']['Insert'];
type UpdateCompanyInput = Database['public']['Tables']['companies']['Update'];

export interface CompanyFilters {
  status?: Company['status'][];
  priority?: number[];
  isFavorite?: boolean;
  search?: string;
  hasFollowup?: boolean;
}

export async function getCompanies(userId: string, filters?: CompanyFilters): Promise<Company[]> {
  let query = supabase
    .from('companies')
    .select('*')
    .eq('user_id', userId);

  if (filters?.status && filters.status.length > 0) {
    query = query.in('status', filters.status);
  }

  if (filters?.priority && filters.priority.length > 0) {
    query = query.in('priority', filters.priority);
  }

  if (filters?.isFavorite !== undefined) {
    query = query.eq('is_favorite', filters.isFavorite);
  }

  if (filters?.hasFollowup) {
    query = query.not('next_followup_date', 'is', null);
  }

  if (filters?.search) {
    query = query.or(`name.ilike.%${filters.search}%,job_title.ilike.%${filters.search}%,contact_name.ilike.%${filters.search}%,location.ilike.%${filters.search}%`);
  }

  const { data, error } = await query.order('date_added', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function getCompanyById(companyId: string): Promise<Company | null> {
  const { data, error } = await supabase
    .from('companies')
    .select('*')
    .eq('id', companyId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }
  return data;
}

export async function createCompany(userId: string, company: Omit<CreateCompanyInput, 'user_id'>): Promise<Company> {
  const { data, error } = await supabase
    .from('companies')
    // @ts-expect-error - Supabase typing issue
    .insert({ user_id: userId, ...company })
    .select()
    .single();

  if (error) throw error;
  return data as Company;
}

export async function updateCompany(companyId: string, updates: Partial<Company>): Promise<Company> {
  const { data, error } = await supabase
    .from('companies')
    // @ts-expect-error - Supabase typing issue
    .update(updates)
    .eq('id', companyId)
    .select()
    .single();

  if (error) throw error;
  return data as Company;
}

export async function deleteCompany(companyId: string): Promise<void> {
  const { error } = await supabase
    .from('companies')
    .delete()
    .eq('id', companyId);

  if (error) throw error;
}

export async function toggleFavorite(companyId: string, isFavorite: boolean): Promise<Company> {
  return updateCompany(companyId, { is_favorite: isFavorite });
}

export async function getUpcomingFollowups(userId: string, daysAhead: number = 7): Promise<Company[]> {
  const today = new Date();
  const futureDate = new Date();
  futureDate.setDate(today.getDate() + daysAhead);

  const { data, error } = await supabase
    .from('companies')
    .select('*')
    .eq('user_id', userId)
    .gte('next_followup_date', today.toISOString().split('T')[0])
    .lte('next_followup_date', futureDate.toISOString().split('T')[0])
    .order('next_followup_date', { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function getCompanyStats(userId: string): Promise<{
  total: number;
  byStatus: Record<string, number>;
  byPriority: Record<number, number>;
  favorites: number;
  pendingFollowups: number;
}> {
  const { data, error } = await supabase
    .from('companies')
    .select('status, priority, is_favorite, next_followup_date')
    .eq('user_id', userId);

  if (error) throw error;

  const companies = (data || []) as Array<{
    status: string;
    priority: number | null;
    is_favorite: boolean;
    next_followup_date: string | null;
  }>;
  const today = new Date().toISOString().split('T')[0];

  const stats = {
    total: companies.length,
    byStatus: {
      researching: 0,
      applied: 0,
      interviewing: 0,
      offer: 0,
      rejected: 0,
    } as Record<string, number>,
    byPriority: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } as Record<number, number>,
    favorites: 0,
    pendingFollowups: 0,
  };

  companies.forEach((company) => {
    if (company.status in stats.byStatus) {
      stats.byStatus[company.status]++;
    }
    const priority = company.priority || 3;
    if (priority in stats.byPriority) {
      stats.byPriority[priority]++;
    }
    if (company.is_favorite) stats.favorites++;
    if (company.next_followup_date && company.next_followup_date <= today) {
      stats.pendingFollowups++;
    }
  });

  return stats;
}

export type { Company, CreateCompanyInput, UpdateCompanyInput };
