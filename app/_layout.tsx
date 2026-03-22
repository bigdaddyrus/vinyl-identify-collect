import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as ExpoSplashScreen from 'expo-splash-screen';
import { useFonts, PlayfairDisplay_700Bold } from '@expo-google-fonts/playfair-display';
import { router } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-reanimated';
import { useAppStoreHydration, useAppStore } from '@/store/useAppStore';
import { appConfig } from '@/config/appConfig';
import { signInAnonymously, ensureProfile } from '@/services/auth';
import { migrateLocalToCloud, hasMigrated } from '@/services/migration';
import { supabase } from '@/lib/supabase';

// Prevent auto-hiding splash screen
ExpoSplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  // Load custom fonts
  const [fontsLoaded] = useFonts({
    PlayfairDisplay_700Bold,
  });

  // Wait for store hydration
  const storeHydrated = useAppStoreHydration();

  // Auth initialization
  const [authReady, setAuthReady] = useState(false);
  const setProfileId = useAppStore((s) => s.setProfileId);

  useEffect(() => {
    if (!storeHydrated) return;

    async function initAuth() {
      try {
        // Check for existing session
        const { data: { session } } = await supabase.auth.getSession();

        if (!session) {
          // First launch: anonymous sign-in
          await signInAnonymously();
        }

        // Ensure profile exists
        const profile = await ensureProfile();
        if (profile) {
          setProfileId(profile.id);

          // One-time migration
          const migrated = await hasMigrated();
          if (!migrated) {
            await migrateLocalToCloud(profile.id);
          }
        }
      } catch (err) {
        // Auth failure is non-blocking — app works offline
        console.warn('[Auth] Initialization failed (app works offline):', err);
      } finally {
        setAuthReady(true);
      }
    }

    initAuth();
  }, [storeHydrated, setProfileId]);

  // Wait for fonts, store, and auth before hiding splash
  const ready = fontsLoaded && storeHydrated && authReady;

  useEffect(() => {
    if (ready) {
      ExpoSplashScreen.hideAsync();

      // Debug mode: always force full flow from splash
      if (appConfig.debugMode) {
        router.replace('/splash');
      }
    }
  }, [ready]);

  // Keep splash visible until ready
  if (!ready) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'fade',
        }}
      >
        <Stack.Screen name="splash" />
        <Stack.Screen name="onboarding" />
        <Stack.Screen
          name="paywall"
          options={{
            presentation: 'modal',
            animation: 'slide_from_bottom',
          }}
        />
        <Stack.Screen
          name="map"
          options={{
            presentation: 'modal',
            animation: 'slide_from_bottom',
          }}
        />
        <Stack.Screen name="(tabs)" />
      </Stack>
      <StatusBar style="light" />
    </GestureHandlerRootView>
  );
}
