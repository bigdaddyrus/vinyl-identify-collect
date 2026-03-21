import { useLayoutEffect } from 'react';
import { Stack, useSegments, useNavigation } from 'expo-router';

const HIDE_TAB_BAR_SCREENS = ['loading', 'result', 'notfound'];

/** Default tab bar style — must match (tabs)/_layout.tsx */
const DEFAULT_TAB_BAR_STYLE = {
  backgroundColor: '#0A0A0A',
  borderTopWidth: 0,
  paddingTop: 8,
  paddingBottom: 8,
  height: 70,
} as const;

export default function ScannerLayout() {
  const segments = useSegments();
  const navigation = useNavigation();

  const currentScreen = segments[segments.length - 1];
  const shouldHideTabBar = HIDE_TAB_BAR_SCREENS.includes(currentScreen);

  // useNavigation() in a nested layout returns the navigation for this
  // screen in the parent (Tabs) navigator — setOptions directly, no getParent().
  useLayoutEffect(() => {
    navigation.setOptions({
      tabBarStyle: shouldHideTabBar
        ? { display: 'none' as const }
        : DEFAULT_TAB_BAR_STYLE,
    });
  }, [shouldHideTabBar, navigation]);

  return (
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
      <Stack.Screen name="result" />
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
    </Stack>
  );
}
