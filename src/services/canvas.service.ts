import { supabase } from './supabase';
import type { Database } from '../types/database.types';

// Type definition from generated database types
type CareerCanvas = Database['public']['Tables']['career_canvas']['Row'];
type CareerCanvasInsert = Database['public']['Tables']['career_canvas']['Insert'];

// Maximum number of canvases per user
export const MAX_CANVASES = 3;

// Default empty canvas
const emptyCanvas: Partial<CareerCanvas> = {
  name: 'My Career Canvas',
  section_1_helpers: '',
  section_2_activities: '',
  section_3_value: '',
  section_4_interactions: '',
  section_5_convince: '',
  section_6_skills: '',
  section_7_motivation: '',
  section_8_sacrifices: '',
  section_9_outcomes: '',
  completion_percentage: 0,
  linked_plan_id: null,
  order_index: 0,
};

// Get all canvases for a user (up to 3)
export async function getAllCanvases(userId: string): Promise<CareerCanvas[]> {
  try {
    const { data, error } = await (supabase
      .from('career_canvas') as any)
      .select('*')
      .eq('user_id', userId)
      .order('order_index', { ascending: true });

    if (error) {
      // If order_index column doesn't exist, fallback to simple query
      if (error.message?.includes('order_index')) {
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('career_canvas')
          .select('*')
          .eq('user_id', userId);

        if (fallbackError) throw fallbackError;
        // Add default values for new fields
        return (fallbackData || []).map((c: any, i: number) => ({
          ...c,
          name: c.name || 'My Career Canvas',
          order_index: i,
          linked_plan_id: c.linked_plan_id || null,
        })) as CareerCanvas[];
      }
      throw error;
    }
    return (data || []) as CareerCanvas[];
  } catch (err: any) {
    // Fallback for any error - try simple query
    const { data, error } = await supabase
      .from('career_canvas')
      .select('*')
      .eq('user_id', userId);

    if (error) throw error;
    return (data || []).map((c: any, i: number) => ({
      ...c,
      name: c.name || 'My Career Canvas',
      order_index: i,
      linked_plan_id: c.linked_plan_id || null,
    })) as CareerCanvas[];
  }
}

// Get a single canvas by ID
export async function getCanvasById(canvasId: string): Promise<CareerCanvas | null> {
  const { data, error } = await (supabase
    .from('career_canvas') as any)
    .select('*')
    .eq('id', canvasId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; // Not found
    throw error;
  }
  return data as CareerCanvas;
}

// Get the primary canvas for a user (for backward compatibility)
export async function getCanvas(userId: string) {
  const { data, error } = await (supabase
    .from('career_canvas') as any)
    .select('*')
    .eq('user_id', userId)
    .order('order_index', { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) throw error;

  // Return empty canvas if none exists to avoid undefined access
  return (data || emptyCanvas) as Partial<CareerCanvas>;
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

// Create a new canvas with career goal details
export interface CreateCanvasInput {
  targetRole: string;
  currentRole?: string;
  targetDate?: string;
  industry?: string;
}

export async function createCanvas(
  userId: string,
  input: string | CreateCanvasInput = 'My Career Canvas'
): Promise<CareerCanvas> {
  if (!userId) {
    throw new Error('User ID is required to create a canvas');
  }

  // Handle both string (legacy) and object input
  const canvasData = typeof input === 'string'
    ? { targetRole: input, currentRole: undefined, targetDate: undefined, industry: undefined }
    : input;

  const { targetRole, currentRole, targetDate, industry } = canvasData;

  // Check how many canvases user already has
  const existingCanvases = await getAllCanvases(userId);
  if (existingCanvases.length >= MAX_CANVASES) {
    throw new Error(`You can only have up to ${MAX_CANVASES} career canvases.`);
  }

  // If user already has a canvas, try to add another (requires migration)
  if (existingCanvases.length > 0) {
    // Try to insert with new columns
    const newOrderIndex = existingCanvases.length;

    const { data, error } = await (supabase
      .from('career_canvas') as any)
      .insert({
        user_id: userId,
        name: targetRole,
        target_role: targetRole,
        current_role: currentRole,
        target_date: targetDate,
        industry: industry,
        order_index: newOrderIndex,
        completion_percentage: 0,
      })
      .select()
      .single();

    if (error) {
      console.error('Create canvas error:', error);
      // If insert fails, the DB hasn't been migrated yet
      throw new Error('To create multiple canvases, please run the database migration. Go to Supabase SQL Editor and run the migration script.');
    }
    return data as CareerCanvas;
  }

  // First canvas - use simple insert (not upsert)
  const { data, error } = await supabase
    .from('career_canvas')
    .insert({
      user_id: userId,
      name: targetRole,
      target_role: targetRole,
      current_role: currentRole,
      target_date: targetDate,
      industry: industry,
      completion_percentage: 0,
    } as any)
    .select()
    .single();

  if (error) {
    console.error('Create first canvas error:', error);
    throw error;
  }

  // Return with default values if columns don't exist
  const result = data as any;
  return {
    ...result,
    name: result.name || targetRole,
    target_role: result.target_role || targetRole,
    order_index: result.order_index ?? 0,
    linked_plan_id: result.linked_plan_id || null,
  } as CareerCanvas;
}

// Update a canvas
export async function updateCanvas(
  canvasId: string,
  canvasData: Partial<CareerCanvas>
): Promise<CareerCanvas> {
  // First fetch existing data to merge with new data for accurate completion calculation
  const existingCanvas = await getCanvasById(canvasId);
  if (!existingCanvas) {
    throw new Error('Canvas not found');
  }

  const mergedData = { ...existingCanvas, ...canvasData };
  const completionPercentage = calculateCompletionPercentage(mergedData);

  const { data, error } = await (supabase
    .from('career_canvas') as any)
    .update({
      ...canvasData,
      completion_percentage: completionPercentage,
      updated_at: new Date().toISOString(),
    })
    .eq('id', canvasId)
    .select()
    .single();

  if (error) throw error;
  return data as CareerCanvas;
}

// Legacy upsert function for backward compatibility
export async function upsertCanvas(userId: string, canvasData: Partial<CareerCanvas>) {
  // First fetch existing data to merge with new data for accurate completion calculation
  const { data: existingData } = await (supabase
    .from('career_canvas') as any)
    .select('*')
    .eq('user_id', userId)
    .order('order_index', { ascending: true })
    .limit(1)
    .maybeSingle();

  const mergedData = { ...(existingData || {}), ...canvasData };
  const completionPercentage = calculateCompletionPercentage(mergedData);

  const insertData = {
    user_id: userId,
    name: canvasData.name || existingData?.name || 'My Career Canvas',
    ...canvasData,
    completion_percentage: completionPercentage,
  } as CareerCanvasInsert;

  const { data, error } = await (supabase
    .from('career_canvas') as any)
    .upsert(insertData, { onConflict: 'user_id' })
    .select()
    .single();

  if (error) throw error;
  return data as CareerCanvas;
}

// Delete a canvas
export async function deleteCanvas(canvasId: string): Promise<void> {
  const { error } = await (supabase.from('career_canvas') as any).delete().eq('id', canvasId);

  if (error) throw error;
}

// Link a canvas to a 12 weeks plan
export async function linkCanvasToPlan(canvasId: string, planId: string): Promise<CareerCanvas> {
  const { data, error } = await (supabase
    .from('career_canvas') as any)
    .update({ linked_plan_id: planId })
    .eq('id', canvasId)
    .select()
    .single();

  if (error) throw error;
  return data as CareerCanvas;
}

// Unlink a canvas from a 12 weeks plan
export async function unlinkCanvasFromPlan(canvasId: string): Promise<CareerCanvas> {
  const { data, error } = await (supabase
    .from('career_canvas') as any)
    .update({ linked_plan_id: null })
    .eq('id', canvasId)
    .select()
    .single();

  if (error) throw error;
  return data as CareerCanvas;
}

// Check if a canvas can have a 12 weeks plan created (only 1 per canvas)
export async function canCreatePlanForCanvas(canvasId: string): Promise<boolean> {
  const canvas = await getCanvasById(canvasId);
  if (!canvas) return false;
  return !canvas.linked_plan_id;
}
