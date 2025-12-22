import { supabase } from './supabase';
import type { Database } from '../types/database.types';

export type AIPrompt = Database['public']['Tables']['ai_prompts']['Row'];
export type AIPromptInsert = Database['public']['Tables']['ai_prompts']['Insert'];
export type AIPromptUpdate = Database['public']['Tables']['ai_prompts']['Update'];

export async function getAIPrompts(): Promise<AIPrompt[]> {
  const { data, error } = await supabase
    .from('ai_prompts')
    .select('*')
    .order('name');

  if (error) {
    console.error('Error fetching AI prompts:', error);
    throw new Error('Failed to fetch AI prompts');
  }

  return data || [];
}

export async function getAIPromptById(id: string): Promise<AIPrompt | null> {
  const { data, error } = await supabase
    .from('ai_prompts')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; // Not found
    console.error('Error fetching AI prompt:', error);
    throw new Error('Failed to fetch AI prompt');
  }

  return data;
}

export async function updateAIPrompt(id: string, updates: AIPromptUpdate): Promise<AIPrompt> {
  // Use type assertion due to dynamic table types
  const { data, error } = await (supabase
    .from('ai_prompts') as any)
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating AI prompt:', error);
    throw new Error('Failed to update AI prompt');
  }

  return data as AIPrompt;
}

export async function createAIPrompt(prompt: AIPromptInsert): Promise<AIPrompt> {
  // Use type assertion due to dynamic table types
  const { data, error } = await (supabase
    .from('ai_prompts') as any)
    .insert(prompt)
    .select()
    .single();

  if (error) {
    console.error('Error creating AI prompt:', error);
    throw new Error('Failed to create AI prompt');
  }

  return data as AIPrompt;
}

export async function deleteAIPrompt(id: string): Promise<void> {
  const { error } = await (supabase
    .from('ai_prompts') as any)
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting AI prompt:', error);
    throw new Error('Failed to delete AI prompt');
  }
}

// Available models for dropdown
export const AVAILABLE_MODELS = [
  { value: 'gpt-4o-mini', label: 'GPT-4o Mini (Fast, Cost-effective)' },
  { value: 'gpt-4o', label: 'GPT-4o (Best Quality)' },
  { value: 'gpt-4-turbo', label: 'GPT-4 Turbo (High Quality)' },
  { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo (Fastest, Cheapest)' },
  { value: 'claude-3-5-sonnet-20241022', label: 'Claude 3.5 Sonnet (Anthropic)' },
  { value: 'claude-3-haiku-20240307', label: 'Claude 3 Haiku (Fast, Anthropic)' },
];
