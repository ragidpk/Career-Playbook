import { supabase } from './supabase';
import type { Database } from '../types/database.types';

type Profile = Database['public']['Tables']['profiles']['Row'];
type ProfileUpdate = Database['public']['Tables']['profiles']['Update'];

export async function getProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // No profile found
      return null;
    }
    throw error;
  }

  return data as Profile;
}

export async function updateProfile(
  userId: string,
  updates: ProfileUpdate
): Promise<Profile> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const profilesTable = supabase.from('profiles') as any;
  const { data, error } = await profilesTable
    .update(updates)
    .eq('id', userId)
    .select()
    .single();

  if (error) throw error;
  return data as Profile;
}

export async function completeOnboarding(
  userId: string,
  profileData: ProfileUpdate
): Promise<Profile> {
  const updateData = {
    ...profileData,
    profile_completed: true,
    onboarding_completed_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const profilesTable = supabase.from('profiles') as any;
  const { data, error } = await profilesTable
    .update(updateData)
    .eq('id', userId)
    .select()
    .single();

  if (error) throw error;
  return data as Profile;
}

export async function isProfileComplete(userId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) {
    console.error('Error checking profile completion:', error);
    return false;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data as any)?.profile_completed === true;
}

// Constants for dropdowns
export const YEARS_OF_EXPERIENCE_OPTIONS = [
  { value: '0-1', label: 'Less than 1 year' },
  { value: '1-3', label: '1-3 years' },
  { value: '3-5', label: '3-5 years' },
  { value: '5-10', label: '5-10 years' },
  { value: '10-15', label: '10-15 years' },
  { value: '15+', label: '15+ years' },
];

export const JOB_SEARCH_STATUS_OPTIONS = [
  { value: 'actively_looking', label: 'Actively Looking' },
  { value: 'passively_looking', label: 'Passively Looking' },
  { value: 'open_to_opportunities', label: 'Open to Opportunities' },
  { value: 'employed_not_looking', label: 'Employed, Not Looking' },
];

export const WORK_PREFERENCE_OPTIONS = [
  { value: 'remote', label: 'Remote' },
  { value: 'hybrid', label: 'Hybrid' },
  { value: 'onsite', label: 'On-site' },
  { value: 'flexible', label: 'Flexible' },
];

export const EDUCATION_LEVEL_OPTIONS = [
  { value: 'high_school', label: 'High School' },
  { value: 'associate', label: 'Associate Degree' },
  { value: 'bachelor', label: "Bachelor's Degree" },
  { value: 'master', label: "Master's Degree" },
  { value: 'doctorate', label: 'Doctorate / PhD' },
  { value: 'other', label: 'Other' },
];

export const INDUSTRY_OPTIONS = [
  'Technology',
  'Finance & Banking',
  'Healthcare',
  'Education',
  'Marketing & Advertising',
  'Consulting',
  'Manufacturing',
  'Retail & E-commerce',
  'Real Estate',
  'Energy & Utilities',
  'Media & Entertainment',
  'Government',
  'Non-profit',
  'Legal',
  'Other',
];

export const SALARY_RANGE_OPTIONS = [
  { value: '0-50k', label: '$0 - $50,000' },
  { value: '50k-75k', label: '$50,000 - $75,000' },
  { value: '75k-100k', label: '$75,000 - $100,000' },
  { value: '100k-125k', label: '$100,000 - $125,000' },
  { value: '125k-150k', label: '$125,000 - $150,000' },
  { value: '150k-200k', label: '$150,000 - $200,000' },
  { value: '200k+', label: '$200,000+' },
  { value: 'negotiable', label: 'Negotiable' },
];
