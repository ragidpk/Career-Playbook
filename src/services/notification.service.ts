import { supabase } from './supabase';
import type { Database } from '../types/database.types';

type Notification = Database['public']['Tables']['notifications']['Row'];
type NotificationPreferences = Database['public']['Tables']['notification_preferences']['Row'];
type CreateNotificationInput = Database['public']['Tables']['notifications']['Insert'];
type UpdatePreferencesInput = Database['public']['Tables']['notification_preferences']['Update'];

export async function getNotifications(userId: string): Promise<Notification[]> {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as Notification[];
}

export async function getUnreadCount(userId: string): Promise<number> {
  const { count, error } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('is_read', false);

  if (error) throw error;
  return count || 0;
}

export async function markAsRead(notificationId: string): Promise<void> {
  const { error } = await supabase
    .from('notifications')
    // @ts-expect-error - Supabase typing issue
    .update({ is_read: true })
    .eq('id', notificationId);

  if (error) throw error;
}

export async function markAllAsRead(userId: string): Promise<void> {
  const { error } = await supabase
    .from('notifications')
    // @ts-expect-error - Supabase typing issue
    .update({ is_read: true })
    .eq('user_id', userId)
    .eq('is_read', false);

  if (error) throw error;
}

export async function deleteNotification(id: string): Promise<void> {
  const { error } = await supabase
    .from('notifications')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

export async function getPreferences(userId: string): Promise<NotificationPreferences> {
  const { data, error } = await supabase
    .from('notification_preferences')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error) {
    // If preferences don't exist, create default ones
    if (error.code === 'PGRST116') {
      return createDefaultPreferences(userId);
    }
    throw error;
  }

  return data as NotificationPreferences;
}

async function createDefaultPreferences(userId: string): Promise<NotificationPreferences> {
  const { data, error } = await supabase
    .from('notification_preferences')
    // @ts-expect-error - Supabase typing issue
    .insert({
      user_id: userId,
      email_interview_reminder: true,
      email_follow_up_reminder: true,
      email_milestone_reminder: true,
      email_weekly_summary: true,
      in_app_enabled: true,
      reminder_days_before: 1,
    })
    .select()
    .single();

  if (error) throw error;
  return data as NotificationPreferences;
}

export async function updatePreferences(
  userId: string,
  updates: Partial<UpdatePreferencesInput>
): Promise<NotificationPreferences> {
  const { data, error } = await supabase
    .from('notification_preferences')
    // @ts-expect-error - Supabase typing issue
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId)
    .select()
    .single();

  if (error) throw error;
  return data as NotificationPreferences;
}

export async function createNotification(
  notification: Omit<CreateNotificationInput, 'id' | 'created_at'>
): Promise<Notification> {
  const { data, error } = await supabase
    .from('notifications')
    // @ts-expect-error - Supabase typing issue
    .insert(notification)
    .select()
    .single();

  if (error) throw error;
  return data as Notification;
}
