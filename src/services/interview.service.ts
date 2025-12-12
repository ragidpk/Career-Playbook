import { supabase } from './supabase';
import type { Database } from '../types/database.types';

type Interview = Database['public']['Tables']['interviews']['Row'];
type CreateInterviewInput = Database['public']['Tables']['interviews']['Insert'];
type UpdateInterviewInput = Database['public']['Tables']['interviews']['Update'];

export async function getInterviews(userId: string): Promise<Interview[]> {
  const { data, error } = await supabase
    .from('interviews')
    .select('*')
    .eq('user_id', userId)
    .order('scheduled_at', { ascending: false, nullsFirst: false });

  if (error) throw error;
  return data || [];
}

export async function getInterviewsByCompany(companyId: string): Promise<Interview[]> {
  const { data, error } = await supabase
    .from('interviews')
    .select('*')
    .eq('company_id', companyId)
    .order('scheduled_at', { ascending: false, nullsFirst: false });

  if (error) throw error;
  return data || [];
}

export async function getUpcomingInterviews(userId: string, days: number = 7): Promise<Interview[]> {
  const now = new Date();
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + days);

  const { data, error } = await supabase
    .from('interviews')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'scheduled')
    .gte('scheduled_at', now.toISOString())
    .lte('scheduled_at', futureDate.toISOString())
    .order('scheduled_at', { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function createInterview(userId: string, interview: Omit<CreateInterviewInput, 'user_id'>): Promise<Interview> {
  const { data, error } = await supabase
    .from('interviews')
    // @ts-expect-error - Supabase typing issue
    .insert({ user_id: userId, ...interview })
    .select()
    .single();

  if (error) throw error;
  return data as Interview;
}

export async function updateInterview(interviewId: string, updates: Partial<Interview>): Promise<Interview> {
  const { data, error } = await supabase
    .from('interviews')
    // @ts-expect-error - Supabase typing issue
    .update(updates)
    .eq('id', interviewId)
    .select()
    .single();

  if (error) throw error;
  return data as Interview;
}

export async function deleteInterview(interviewId: string): Promise<void> {
  const { error } = await supabase
    .from('interviews')
    .delete()
    .eq('id', interviewId);

  if (error) throw error;
}

export type { Interview, CreateInterviewInput, UpdateInterviewInput };
