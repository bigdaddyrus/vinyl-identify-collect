import { View, StyleSheet, ViewStyle } from 'react-native';
import { visualFeatures } from '@/theme';
import { colors } from '@/theme';

interface Props {
  position: 'left' | 'right';
  size?: number;
  color?: string;
  style?: ViewStyle;
}

export function LaurelWreath({
  position,
  size = 40,
  color = colors.accentTertiary,
  style
}: Props) {
  // Only render if wreaths are enabled in config
  if (!visualFeatures.showLaurelWreaths) {
    return null;
  }

  // Simple text-based laurel wreath representation
  // In production, this would be an SVG component
  const wreathSymbol = position === 'left' ? '🌿' : '🌿';

  return (
    <View style={[styles.container, { width: size, height: size }, style]}>
      <View style={[
        styles.wreath,
        position === 'left' && styles.wreathLeft,
        position === 'right' && styles.wreathRight,
      ]}>
        {/* Placeholder: Replace with actual SVG laurel wreath */}
        {/* For now, using decorative elements */}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  wreath: {
    width: '100%',
    height: '100%',
    opacity: 0.6,
  },
  wreathLeft: {
    transform: [{ scaleX: -1 }],
  },
  wreathRight: {
    // Default orientation
  },
});
