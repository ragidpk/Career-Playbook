import { supabase } from './supabase';
import type { Database } from '../types/database.types';

type Company = Database['public']['Tables']['companies']['Row'];
type CreateCompanyInput = Database['public']['Tables']['companies']['Insert'];
type UpdateCompanyInput = Database['public']['Tables']['companies']['Update'];

export async function getCompanies(userId: string): Promise<Company[]> {
  const { data, error } = await supabase
    .from('companies')
    .select('*')
    .eq('user_id', userId)
    .order('date_added', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function createCompany(userId: string, company: Omit<CreateCompanyInput, 'user_id'>): Promise<Company> {
  const { data, error } = await supabase
    .from('companies')
    // @ts-ignore - Supabase typing issue
    .insert({ user_id: userId, ...company })
    .select()
    .single();

  if (error) throw error;
  return data as Company;
}

export async function updateCompany(companyId: string, updates: Partial<Company>): Promise<Company> {
  const { data, error } = await supabase
    .from('companies')
    // @ts-ignore - Supabase typing issue
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

export type { Company, CreateCompanyInput, UpdateCompanyInput };
