import { supabase } from './supabase';
import type { Database } from '../types/database.types';

// Type definition from generated database types
type CareerCanvas = Database['public']['Tables']['career_canvas']['Row'];
type CareerCanvasInsert = Database['public']['Tables']['career_canvas']['Insert'];

// Default empty canvas
const emptyCanvas: Partial<CareerCanvas> = {
  section_1_helpers: '',
  section_2_activities: '',
  section_3_value: '',
  section_4_interactions: '',
  section_5_convince: '',
  section_6_skills: '',
  section_7_motivation: '',
  section_8_sacrifices: '',
  section_9_outcomes: '',
  completion_percentage: 0
};

export async function getCanvas(userId: string) {
  const { data, error } = await supabase
    .from('career_canvas')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) throw error;

  // Return empty canvas if none exists to avoid undefined access
  return data || emptyCanvas;
}

export async function upsertCanvas(userId: string, canvasData: Partial<CareerCanvas>) {
  const insertData = {
    user_id: userId,
    ...canvasData
  } as CareerCanvasInsert;

  const { data, error } = await supabase
    .from('career_canvas')
    .upsert(insertData as any, { onConflict: 'user_id' })
    .select()
    .single();

  if (error) throw error;
  return data;
}
