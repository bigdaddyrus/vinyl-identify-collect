import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { appConfig } from '@/config/appConfig';
import type { SubscriptionRow } from '@/types/database';

const APP_ID = appConfig.appSlug;

/**
 * Hook to read subscription status for the current profile.
 * Subscriptions are read-only from the client — only service_role
 * (RevenueCat webhooks) can modify them.
 */
export function useSubscription(profileId: string | null) {
  const [subscription, setSubscription] = useState<SubscriptionRow | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!profileId) {
      setIsLoading(false);
      return;
    }

    async function fetch() {
      try {
        const { data, error } = await supabase
          .from('subscriptions')
          .select('*')
          .eq('profile_id', profileId!)
          .eq('app_id', APP_ID)
          .single();

        if (error && error.code !== 'PGRST116') throw error;
        setSubscription(data);
      } catch (err) {
        console.error('[useSubscription] Error:', err);
      } finally {
        setIsLoading(false);
      }
    }

    fetch();

    // Real-time subscription updates (for webhook-driven changes)
    const channel = supabase
      .channel('subscription-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'subscriptions',
          filter: `profile_id=eq.${profileId}`,
        },
        (payload) => {
          setSubscription(payload.new as SubscriptionRow);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profileId]);

  return {
    subscription,
    isLoading,
    isPremium: subscription?.is_premium ?? false,
    status: subscription?.status ?? 'none',
    planType: subscription?.plan_type ?? null,
  };
}
