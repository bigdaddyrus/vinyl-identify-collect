import { StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface Props {
  intensity?: number;
  height?: number | string;
}

/**
 * Ambient top-down gold glow.
 * Absolutely positioned, full-width gradient fading from faint gold to transparent.
 * Parent must have `position: 'relative'` or `overflow: 'hidden'`.
 */
export function GoldenGlow({ intensity = 0.15, height = 300 }: Props) {
  return (
    <LinearGradient
      colors={[`rgba(212, 175, 55, ${intensity})`, 'transparent']}
      locations={[0, 1]}
      style={[styles.glow, { height: height as any }]}
      pointerEvents="none"
    />
  );
}

const styles = StyleSheet.create({
  glow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
});
