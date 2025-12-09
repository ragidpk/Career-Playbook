import { supabase } from './supabase';

// Get base URL from environment or fallback to current origin
const getBaseUrl = () => {
  return import.meta.env.VITE_APP_URL || window.location.origin;
};

export async function signUp(email: string, password: string, fullName: string) {
  // Ensure emailRedirectTo matches configured site URL in Supabase Auth settings
  const redirectUrl = `${getBaseUrl()}/auth/callback`;

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName },
      emailRedirectTo: redirectUrl
    }
  });

  if (error) {
    // Handle specific error cases
    if (error.message.includes('already registered')) {
      throw new Error('This email is already registered. Please login instead.');
    }
    throw error;
  }

  // Profile is auto-created by database trigger (handle_new_user)
  // No need for manual profile creation

  return data;
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function resetPassword(email: string) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${getBaseUrl()}/auth/reset-password`
  });
  if (error) throw error;
}

export async function updatePassword(newPassword: string) {
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) throw error;
}

export async function getSession() {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  return data.session;
}
