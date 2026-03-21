import { supabase } from '@/lib/supabase';
import { appConfig } from '@/config/appConfig';
import type { UserPreferencesRow } from '@/types/database';

const APP_ID = appConfig.appSlug;

/**
 * Fetch user preferences for the current profile.
 */
export async function fetchPreferences(profileId: string): Promise<UserPreferencesRow | null> {
  const { data, error } = await supabase
    .from('user_preferences')
    .select('*')
    .eq('profile_id', profileId)
    .eq('app_id', APP_ID)
    .single();

  if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows
  return data;
}

/**
 * Update user preferences (partial update).
 */
export async function updatePreferences(
  profileId: string,
  updates: Partial<Pick<
    UserPreferencesRow,
    'has_completed_onboarding' | 'has_seen_paywall' | 'has_seen_snap_tips' | 'has_triggered_review' | 'scan_count' | 'custom_preferences'
  >>
): Promise<void> {
  const { error } = await supabase
    .from('user_preferences')
    .update(updates)
    .eq('profile_id', profileId)
    .eq('app_id', APP_ID);

  if (error) throw error;
}

/**
 * Sync local Zustand state to user_preferences (used during migration).
 */
export async function syncPreferencesFromLocal(
  profileId: string,
  localState: {
    hasCompletedOnboarding: boolean;
    hasSeenPaywall: boolean;
    hasSeenSnapTips: boolean;
    hasTriggeredReview: boolean;
    scanCount: number;
  }
): Promise<void> {
  await updatePreferences(profileId, {
    has_completed_onboarding: localState.hasCompletedOnboarding,
    has_seen_paywall: localState.hasSeenPaywall,
    has_seen_snap_tips: localState.hasSeenSnapTips,
    has_triggered_review: localState.hasTriggeredReview,
    scan_count: localState.scanCount,
  });
}
