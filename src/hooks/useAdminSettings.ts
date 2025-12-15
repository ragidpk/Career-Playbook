import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../services/supabase';

export interface AppSetting {
  id: string;
  key: string;
  value: Record<string, unknown>;
  description: string | null;
  category: string;
  updated_at: string;
  updated_by: string | null;
}

export interface SettingsByCategory {
  general: AppSetting[];
  limits: AppSetting[];
  features: AppSetting[];
  notifications: AppSetting[];
  auth: AppSetting[];
}

export function useAdminSettings() {
  const [settings, setSettings] = useState<AppSetting[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadSettings = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error: fetchError } = await (supabase as any)
        .from('app_settings')
        .select('*')
        .order('category')
        .order('key');

      if (fetchError) throw fetchError;
      setSettings(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load settings');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const updateSetting = async (key: string, value: Record<string, unknown>) => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: updateError } = await (supabase as any)
        .from('app_settings')
        .update({ value })
        .eq('key', key);

      if (updateError) throw updateError;
      await loadSettings(); // Refresh
      return { success: true };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Failed to update' };
    }
  };

  const getSettingsByCategory = (): SettingsByCategory => {
    const result: SettingsByCategory = {
      general: [],
      limits: [],
      features: [],
      notifications: [],
      auth: [],
    };

    settings.forEach((setting) => {
      const category = setting.category as keyof SettingsByCategory;
      if (result[category]) {
        result[category].push(setting);
      }
    });

    return result;
  };

  const getSetting = (key: string): AppSetting | undefined => {
    return settings.find((s) => s.key === key);
  };

  const getSettingValue = <T = unknown>(key: string, defaultValue: T): T => {
    const setting = getSetting(key);
    if (!setting) return defaultValue;
    return setting.value as T;
  };

  return {
    settings,
    isLoading,
    error,
    refresh: loadSettings,
    updateSetting,
    getSettingsByCategory,
    getSetting,
    getSettingValue,
  };
}
