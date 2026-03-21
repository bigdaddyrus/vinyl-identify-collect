import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius, shadows } from '@/theme';

interface Props {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
}

export function InsightCard({ icon, label, value }: Props) {
  return (
    <LinearGradient
      colors={[colors.gradientStart, colors.gradientEnd]}
      style={styles.container}
    >
      <View style={styles.iconContainer}>
        <Ionicons name={icon} size={24} color={colors.accentSecondary} />
      </View>
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.lg,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 120,
    ...shadows.small,
  },
  iconContainer: {
    marginBottom: spacing.sm,
  },
  value: {
    ...typography.h2,
    color: colors.textPrimary,
    fontFamily: 'PlayfairDisplay_700Bold',
    marginBottom: spacing.xs,
  },
  label: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
