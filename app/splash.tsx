import { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { appConfig } from '@/config/appConfig';
import { colors } from '@/theme';

export default function SplashScreen() {
  const { splash } = appConfig;

  useEffect(() => {
    const timer = setTimeout(() => {
      router.replace('/onboarding');
    }, splash.autoTransitionMs);

    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      {splash.backgroundImage && (
        <Image
          source={splash.backgroundImage}
          style={StyleSheet.absoluteFillObject}
          contentFit="cover"
        />
      )}
      {/* Dark overlay so the app name is legible */}
      <View style={styles.overlay} />
      {splash.showGoldenGlow && (
        <LinearGradient
          colors={['rgba(212, 175, 55, 0.15)', 'transparent']}
          locations={[0, 1]}
          style={styles.ambientGlow}
          pointerEvents="none"
        />
      )}
      <Text style={styles.appName}>{appConfig.appName}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(5, 5, 5, 0.45)',
  },
  ambientGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '60%',
  },
  appName: {
    fontSize: 42,
    color: colors.textPrimary,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
});
