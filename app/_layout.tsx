import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as ExpoSplashScreen from 'expo-splash-screen';
import { useFonts, PlayfairDisplay_700Bold } from '@expo-google-fonts/playfair-display';
import { router } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-reanimated';
import { useAppStoreHydration, useAppStore } from '@/store/useAppStore';
import { appConfig } from '@/config/appConfig';
import { initRevenueCat, checkPremiumStatus } from '@/lib/revenueCat';

// Prevent auto-hiding splash screen
ExpoSplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  // Load custom fonts
  const [fontsLoaded] = useFonts({
    PlayfairDisplay_700Bold,
  });

  // Wait for store hydration
  const storeHydrated = useAppStoreHydration();

  // Initialize RevenueCat and check premium status
  useEffect(() => {
    if (!storeHydrated) return;

    async function initPurchases() {
      try {
        await initRevenueCat();
        const isPremium = await checkPremiumStatus();
        useAppStore.getState().setPremium(isPremium);
      } catch {
        // Purchase init failure is non-blocking
      }
    }

    initPurchases();
  }, [storeHydrated]);

  // Wait for fonts and store before hiding splash
  const ready = fontsLoaded && storeHydrated;

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
