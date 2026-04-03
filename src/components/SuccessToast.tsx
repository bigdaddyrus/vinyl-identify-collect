import { useEffect, useCallback, useRef, useState } from 'react';
import { Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  runOnJS,
  Easing,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing, borderRadius } from '@/theme';

interface ToastMessage {
  id: number;
  text: string;
}

let globalShowToast: ((message: string) => void) | null = null;

/**
 * Show a brief success notification bubble from anywhere.
 * The <SuccessToast /> component must be mounted (e.g. in root layout).
 */
export function showSuccessToast(message: string) {
  globalShowToast?.(message);
}

export function SuccessToast() {
  const insets = useSafeAreaInsets();
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const idRef = useRef(0);
  const translateY = useSharedValue(-100);
  const opacity = useSharedValue(0);

  const dismiss = useCallback(() => {
    setToast(null);
  }, []);

  const show = useCallback(
    (message: string) => {
      const id = ++idRef.current;
      setToast({ id, text: message });

      // Slide in
      translateY.value = withTiming(0, { duration: 300, easing: Easing.out(Easing.cubic) });
      opacity.value = withTiming(1, { duration: 250 });

      // Auto-dismiss after 2s
      translateY.value = withDelay(
        2000,
        withTiming(-100, { duration: 300, easing: Easing.in(Easing.cubic) }, () => {
          runOnJS(dismiss)();
        })
      );
      opacity.value = withDelay(2000, withTiming(0, { duration: 300 }));
    },
    [translateY, opacity, dismiss]
  );

  useEffect(() => {
    globalShowToast = show;
    return () => {
      globalShowToast = null;
    };
  }, [show]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  if (!toast) return null;

  return (
    <Animated.View
      style={[styles.container, { top: insets.top + spacing.sm }, animatedStyle]}
      pointerEvents="none"
    >
      <Ionicons name="checkmark-circle" size={20} color={colors.success} />
      <Text style={styles.text}>{toast.text}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: spacing.xl,
    right: spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.surfaceElevated,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    zIndex: 9999,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  text: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
  },
});
