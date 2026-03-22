import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { File } from 'expo-file-system';
import { AppStore, AnalysisResult, OriginDistribution } from '@/types';
import { appConfig } from '@/config/appConfig';
import { useState, useEffect } from 'react';
import { getRarityScore } from '@/utils/rarity';
import { normalizeOrigin, getCoordinates } from '@/data/countryCoordinates';

/**
 * Global app state using Zustand with AsyncStorage persistence
 * No Provider needed - direct hook access
 */

export const useAppStore = create<AppStore>()(
  persist(
    (set, get) => ({
      // Initial state
      hasCompletedOnboarding: false,
      hasSeenPaywall: false,
      isPremium: false,
      collection: [],
      scanCount: 0,
      hasTriggeredReview: false,
      hasSeenSnapTips: false,

      // Supabase sync state
      profileId: null,
      isSyncing: false,
      lastSyncedAt: null,

      // Actions
      completeOnboarding: () => set({ hasCompletedOnboarding: true }),

      seePaywall: () => set({ hasSeenPaywall: true }),

      setPremium: (isPremium: boolean) => set({ isPremium }),

      addToCollection: (item: AnalysisResult) => {
        const { collection, hasTriggeredReview } = get();

        // Add item to collection
        set({ collection: [...collection, item] });

        // ASO Review trigger: first time adding item with value > threshold
        if (
          !hasTriggeredReview &&
          item.estimatedValue > appConfig.aso.reviewThresholdValue
        ) {
          // Note: StoreReview.requestReview() should be called from the component
          // after a 1.5s delay to ensure the success haptic completes first
          set({ hasTriggeredReview: true });
        }
      },

      removeFromCollection: (id: string) => {
        const { collection } = get();
        set({ collection: collection.filter((item) => item.id !== id) });
      },

      updateCollectionItem: (id: string, updates: Partial<AnalysisResult>) => {
        const { collection } = get();
        set({
          collection: collection.map((item) =>
            item.id === id ? { ...item, ...updates } : item
          ),
        });
      },

      incrementScanCount: () => {
        const { scanCount } = get();
        set({ scanCount: scanCount + 1 });
      },

      getTotalPortfolioValue: () => {
        const { collection } = get();
        return collection.reduce((total, item) => total + item.estimatedValue, 0);
      },

      triggerReview: () => set({ hasTriggeredReview: true }),

      markSnapTipsSeen: () => set({ hasSeenSnapTips: true }),

      getUniqueOrigins: () => {
        const { collection } = get();
        return new Set(collection.map(item => normalizeOrigin(item.origin))).size;
      },

      getBestItem: () => {
        const { collection } = get();
        if (collection.length === 0) return null;
        return collection.reduce((best, item) =>
          item.estimatedValue > best.estimatedValue ? item : best
        );
      },

      getMostAncientItem: () => {
        const { collection } = get();
        if (collection.length === 0) return null;
        return collection.reduce((oldest, item) => {
          const yearNum = parseInt(item.year, 10);
          const oldestNum = parseInt(oldest.year, 10);
          if (isNaN(yearNum)) return oldest;
          if (isNaN(oldestNum)) return item;
          return yearNum < oldestNum ? item : oldest;
        });
      },

      getRarestItem: () => {
        const { collection } = get();
        if (collection.length === 0) return null;
        return collection.reduce((rarest, item) => {
          return getRarityScore(item.rarity) > getRarityScore(rarest.rarity) ? item : rarest;
        });
      },

      getOriginDistribution: (): OriginDistribution[] => {
        const { collection } = get();
        const originMap = new Map<string, number>();
        collection.forEach((item) => {
          const normalized = normalizeOrigin(item.origin);
          originMap.set(normalized, (originMap.get(normalized) || 0) + 1);
        });
        const result: OriginDistribution[] = [];
        originMap.forEach((count, origin) => {
          const coords = getCoordinates(origin);
          if (coords) {
            result.push({ origin, count, lat: coords.lat, lng: coords.lng });
          } else {
            // Default to 0,0 for unknown origins — still show in list
            result.push({ origin, count, lat: 0, lng: 0 });
          }
        });
        return result.sort((a, b) => b.count - a.count);
      },

      setProfileId: (profileId: string | null) => set({ profileId }),
      setSyncing: (isSyncing: boolean) => set({ isSyncing }),
      setLastSyncedAt: (timestamp: number) => set({ lastSyncedAt: timestamp }),

      clearAllData: async () => {
        const { collection } = get();
        // Delete all stored image files
        for (const item of collection) {
          const uris = item.images?.length ? item.images : item.imageUri ? [item.imageUri] : [];
          for (const uri of uris) {
            if (uri && uri.startsWith('file://')) {
              try {
                const file = new File(uri);
                file.delete();
              } catch {
                // Ignore deletion errors for missing files
              }
            }
          }
        }
        set({ collection: [], scanCount: 0 });
      },

      resetApp: () =>
        set({
          hasCompletedOnboarding: false,
          hasSeenPaywall: false,
          isPremium: false,
          collection: [],
          scanCount: 0,
          hasTriggeredReview: false,
          hasSeenSnapTips: false,
          profileId: null,
          isSyncing: false,
          lastSyncedAt: null,
        }),
    }),
    {
      name: 'vinylcollect-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

/**
 * Hook to wait for store hydration before rendering
 * Use in root layout to prevent flash of wrong state
 */
export const useAppStoreHydration = () => {
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const unsubscribe = useAppStore.persist.onFinishHydration(() => {
      setHydrated(true);
    });

    // If already hydrated, set immediately
    if (useAppStore.persist.hasHydrated()) {
      setHydrated(true);
    }

    return unsubscribe;
  }, []);

  return hydrated;
};
