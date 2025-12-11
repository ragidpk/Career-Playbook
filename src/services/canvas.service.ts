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

function calculateCompletionPercentage(canvasData: Partial<CareerCanvas>): number {
  const sections = [
    'section_1_helpers',
    'section_2_activities',
    'section_3_value',
    'section_4_interactions',
    'section_5_convince',
    'section_6_skills',
    'section_7_motivation',
    'section_8_sacrifices',
    'section_9_outcomes',
  ] as const;

  const filledSections = sections.filter(
    (section) => canvasData[section] && canvasData[section]!.trim().length > 0
  ).length;

  return Math.round((filledSections / sections.length) * 100);
}

export async function upsertCanvas(userId: string, canvasData: Partial<CareerCanvas>) {
  // First fetch existing data to merge with new data for accurate completion calculation
  const { data: existingData } = await supabase
    .from('career_canvas')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  const mergedData = { ...(existingData || {}), ...canvasData };
  const completionPercentage = calculateCompletionPercentage(mergedData);

  const insertData = {
    user_id: userId,
    ...canvasData,
    completion_percentage: completionPercentage,
  } as CareerCanvasInsert;

  const { data, error } = await supabase
    .from('career_canvas')
    .upsert(insertData as any, { onConflict: 'user_id' })
    .select()
    .single();

  if (error) throw error;
  return data;
}
