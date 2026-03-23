import { Tabs, Redirect, router } from 'expo-router';
import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAppStore } from '@/store/useAppStore';
import { appConfig } from '@/config/appConfig';
import { colors } from '@/theme';

export default function TabLayout() {
  const hasCompletedOnboarding = useAppStore((state) => state.hasCompletedOnboarding);
  const hasSeenPaywall = useAppStore((state) => state.hasSeenPaywall);

  // Redirect guards - skip in debug mode (splash handles navigation)
  if (!appConfig.debugMode) {
    if (!hasCompletedOnboarding) {
      return <Redirect href="/onboarding" />;
    }

    if (!hasSeenPaywall) {
      return <Redirect href="/paywall" />;
    }
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.accentPrimary,
        tabBarInactiveTintColor: colors.textTertiary,
        tabBarStyle: {
          backgroundColor: '#0A0A0A',
          borderTopWidth: 0,
          paddingTop: 8,
          paddingBottom: 8,
          height: 70,
        },
      }}
    >
      <Tabs.Screen
        name="(home)"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="(scanner)"
        options={{
          title: 'Scanner',
          tabBarIcon: () => (
            <View style={styles.centerButtonWrapper}>
              <View style={styles.centerButtonBorder}>
                <LinearGradient
                  colors={[colors.gradientAccentStart, colors.gradientAccentEnd]}
                  style={styles.centerButton}
                >
                  <Ionicons name="camera" size={28} color={colors.white} />
                </LinearGradient>
              </View>
            </View>
          ),
          tabBarLabel: () => null, // Hide label for center button
        }}
        listeners={{
          tabPress: (e) => {
            // Always reset to the scanner index screen
            e.preventDefault();
            router.replace('/(tabs)/(scanner)');
          },
        }}
      />
      <Tabs.Screen
        name="portfolio"
        options={{
          title: 'Collection',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="albums" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  centerButtonWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -30,
  },
  centerButtonBorder: {
    width: 68,
    height: 68,
    borderRadius: 34,
    borderWidth: 6,
    borderColor: '#050505',
    overflow: 'hidden',
  },
  centerButton: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
