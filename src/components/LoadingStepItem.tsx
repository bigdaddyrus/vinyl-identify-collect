import { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  cancelAnimation,
  Easing,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing } from '@/theme';

interface Props {
  text: string;
  status: 'pending' | 'active' | 'complete';
}

export function LoadingStepItem({ text, status }: Props) {
  const rotation = useSharedValue(0);
  const scale = useSharedValue(0);
  const opacity = useSharedValue(status === 'pending' ? 0.3 : 1);

  useEffect(() => {
    // Update opacity based on status
    opacity.value = withTiming(
      status === 'pending' ? 0.3 : 1,
      { duration: 300 }
    );

    if (status === 'active') {
      // Start rotating spinner
      rotation.value = withRepeat(
        withTiming(360, {
          duration: 1000,
          easing: Easing.linear,
        }),
        -1, // infinite
        false
      );
    } else if (status === 'complete') {
      // Stop rotation and show checkmark with smooth scale-up (no bounce)
      cancelAnimation(rotation);
      scale.value = withTiming(1, {
        duration: 250,
        easing: Easing.out(Easing.cubic),
      });
    }
  }, [status]);

  const spinnerStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  const checkmarkStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const textStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <View style={styles.container}>
      {/* Icon */}
      <View style={styles.iconContainer}>
        {status === 'complete' ? (
          <Animated.View style={checkmarkStyle}>
            <Ionicons name="checkmark-circle" size={24} color={colors.accentPrimary} />
          </Animated.View>
        ) : (
          <Animated.View style={spinnerStyle}>
            <Ionicons
              name="sync"
              size={24}
              color={status === 'active' ? colors.accentPrimary : colors.border}
            />
          </Animated.View>
        )}
      </View>

      {/* Text */}
      <Animated.Text style={[styles.text, textStyle]}>{text}</Animated.Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  iconContainer: {
    width: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  text: {
    ...typography.body,
    flex: 1,
  },
});
