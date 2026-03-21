import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { signInAnonymously, ensureProfile, linkApple, linkGoogle, signOut as authSignOut } from '@/services/auth';
import { migrateLocalToCloud, hasMigrated } from '@/services/migration';
import { processQueue } from '@/services/syncEngine';
import type { ProfileRow } from '@/types/database';
import type { Session } from '@supabase/supabase-js';

interface AuthState {
  session: Session | null;
  profile: ProfileRow | null;
  isLoading: boolean;
  isAnonymous: boolean;
  error: string | null;
}

/**
 * Hook that manages auth state, profile resolution, and initial migration.
 *
 * On mount:
 * 1. Checks for existing session
 * 2. If none, signs in anonymously
 * 3. Resolves profile (waits for trigger or creates manually)
 * 4. Runs one-time local→cloud migration if needed
 * 5. Processes any queued sync operations
 */
export function useAuth() {
  const [state, setState] = useState<AuthState>({
    session: null,
    profile: null,
    isLoading: true,
    isAnonymous: true,
    error: null,
  });

  const initialize = useCallback(async () => {
    try {
      // 1. Get or create session
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        // First launch: anonymous sign-in
        await signInAnonymously();
        const { data: { session: newSession } } = await supabase.auth.getSession();
        if (!newSession) throw new Error('Failed to create anonymous session');

        // 2. Ensure profile exists
        const profile = await ensureProfile();

        // 3. Run migration
        const migrated = await hasMigrated();
        if (!migrated) {
          await migrateLocalToCloud(profile.id);
        }

        setState({
          session: newSession,
          profile,
          isLoading: false,
          isAnonymous: true,
          error: null,
        });
      } else {
        // Returning user
        const profile = await ensureProfile();
        const isAnonymous = session.user?.is_anonymous ?? true;

        // Process any queued sync operations
        if (profile) {
          await processQueue(profile.id).catch(console.warn);
        }

        setState({
          session,
          profile,
          isLoading: false,
          isAnonymous,
          error: null,
        });
      }
    } catch (err) {
      console.error('[useAuth] Initialization error:', err);
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: err instanceof Error ? err.message : 'Auth initialization failed',
      }));
    }
  }, []);

  useEffect(() => {
    initialize();

    // Listen for auth state changes (e.g. after linking identity)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (session) {
          const profile = await ensureProfile().catch(() => null);
          setState((prev) => ({
            ...prev,
            session,
            profile: profile ?? prev.profile,
            isAnonymous: session.user?.is_anonymous ?? true,
          }));
        } else {
          setState((prev) => ({
            ...prev,
            session: null,
            profile: null,
            isAnonymous: true,
          }));
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [initialize]);

  const upgradeToApple = useCallback(async () => {
    try {
      await linkApple();
    } catch (err) {
      console.error('[useAuth] Apple link error:', err);
    }
  }, []);

  const upgradeToGoogle = useCallback(async () => {
    try {
      await linkGoogle();
    } catch (err) {
      console.error('[useAuth] Google link error:', err);
    }
  }, []);

  const signOut = useCallback(async () => {
    try {
      await authSignOut();
      setState({
        session: null,
        profile: null,
        isLoading: false,
        isAnonymous: true,
        error: null,
      });
    } catch (err) {
      console.error('[useAuth] Sign out error:', err);
    }
  }, []);

  return {
    ...state,
    profileId: state.profile?.id ?? null,
    upgradeToApple,
    upgradeToGoogle,
    signOut,
    refresh: initialize,
  };
}
