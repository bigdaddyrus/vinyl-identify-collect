import { supabase } from '@/lib/supabase';
import { appConfig } from '@/config/appConfig';
import type { ProfileRow } from '@/types/database';

const APP_ID = appConfig.appSlug;

/**
 * Sign in anonymously. Creates an auth user and triggers the
 * handle_new_user() function which auto-creates a profile row.
 */
export async function signInAnonymously(): Promise<{ userId: string }> {
  const { data, error } = await supabase.auth.signInAnonymously({
    options: { data: { app_id: APP_ID } },
  });

  if (error) throw error;
  if (!data.user) throw new Error('Anonymous sign-in returned no user');

  return { userId: data.user.id };
}

/**
 * Link an anonymous account to Apple Sign-In.
 * Preserves the same UUID — zero data migration.
 */
export async function linkApple(): Promise<void> {
  const { error } = await supabase.auth.linkIdentity({ provider: 'apple' });
  if (error) throw error;
}

/**
 * Link an anonymous account to Google Sign-In.
 */
export async function linkGoogle(): Promise<void> {
  const { error } = await supabase.auth.linkIdentity({ provider: 'google' });
  if (error) throw error;
}

/**
 * Sign in with Apple (for returning named users).
 */
export async function signInWithApple(): Promise<{ userId: string }> {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'apple',
  });

  if (error) throw error;
  // OAuth redirects — the session will be picked up by auth state listener
  return { userId: '' };
}

/**
 * Sign in with Google (for returning named users).
 */
export async function signInWithGoogle(): Promise<{ userId: string }> {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
  });

  if (error) throw error;
  return { userId: '' };
}

/**
 * Sign out the current user.
 */
export async function signOut(): Promise<void> {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

/**
 * Get the current auth user ID, or null if not signed in.
 */
export async function getCurrentUserId(): Promise<string | null> {
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id ?? null;
}

/**
 * Get the profile for the current auth user in this app.
 * Waits briefly for the trigger to create the profile if needed.
 */
export async function getProfile(): Promise<ProfileRow | null> {
  const userId = await getCurrentUserId();
  if (!userId) return null;

  // The profile might not exist yet if the trigger hasn't fired.
  // Retry up to 3 times with a short delay.
  for (let attempt = 0; attempt < 3; attempt++) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('auth_user_id', userId)
      .eq('app_id', APP_ID)
      .single();

    if (data) return data;
    if (error && error.code !== 'PGRST116') throw error;

    // Wait 500ms before retrying
    await new Promise((r) => setTimeout(r, 500));
  }

  return null;
}

/**
 * Get or create a profile for the current auth user.
 * Falls back to manual insert if the trigger hasn't fired.
 */
export async function ensureProfile(): Promise<ProfileRow> {
  const profile = await getProfile();
  if (profile) return profile;

  const userId = await getCurrentUserId();
  if (!userId) throw new Error('No auth user — call signInAnonymously first');

  // Manual fallback: insert profile directly
  const { data, error } = await supabase
    .from('profiles')
    .insert({
      auth_user_id: userId,
      app_id: APP_ID,
      is_anonymous: true,
      auth_provider: 'anonymous',
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}
