import { useLayoutEffect } from 'react';
import { Stack, useNavigation } from 'expo-router';
import { ScanCartProvider } from '@/context/ScanCartContext';

export default function ScannerLayout() {
  const navigation = useNavigation();

  // Hide the bottom tab bar for the entire scanner/camera flow
  useLayoutEffect(() => {
    navigation.setOptions({
      tabBarStyle: { display: 'none' as const },
    });
  }, [navigation]);

  return (
    <ScanCartProvider>
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen
          name="tips"
          options={{
            presentation: 'modal',
            animation: 'slide_from_bottom',
          }}
        />
        <Stack.Screen name="crop" />
        <Stack.Screen
          name="loading"
          options={{
            gestureEnabled: false,
          }}
        />
        <Stack.Screen
          name="result"
          options={{
            gestureEnabled: false,
          }}
        />
        <Stack.Screen
          name="notfound"
          options={{
            gestureEnabled: false,
          }}
        />
        <Stack.Screen
          name="edit"
          options={{
            presentation: 'modal',
            animation: 'slide_from_bottom',
          }}
        />
        <Stack.Screen
          name="share"
          options={{
            presentation: 'modal',
            animation: 'slide_from_bottom',
          }}
        />
        <Stack.Screen name="setdetail" />
      </Stack>
    </ScanCartProvider>
  );
}
