import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, typography, spacing, borderRadius, shadows } from '@/theme';

interface Props {
  plan: 'weekly' | 'annual';
  price: string;
  period: string;
  isSelected: boolean;
  isBestValue?: boolean;
  onPress: () => void;
}

export function PricingCard({ plan, price, period, isSelected, isBestValue, onPress }: Props) {
  const containerStyle = [
    styles.container,
    isSelected && styles.containerSelected,
  ];

  return (
    <TouchableOpacity
      style={containerStyle}
      onPress={onPress}
      activeOpacity={0.8}
    >
      {isBestValue && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>BEST VALUE</Text>
        </View>
      )}

      <LinearGradient
        colors={isSelected
          ? [colors.gradientStart, colors.gradientEnd]
          : [colors.backgroundSecondary, colors.backgroundSecondary]
        }
        style={styles.gradient}
      >
        <View style={styles.content}>
          <Text style={styles.planName}>{plan === 'weekly' ? 'Weekly' : 'Annual'}</Text>
          <View style={styles.priceContainer}>
            <Text style={styles.price}>{price}</Text>
            <Text style={styles.period}>/ {period}</Text>
          </View>
          {plan === 'annual' && (
            <Text style={styles.savings}>Save 40%</Text>
          )}
        </View>

        {isSelected && (
          <View style={styles.selectedIndicator}>
            <View style={styles.checkmark} />
          </View>
        )}
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    overflow: 'hidden',
  },
  containerSelected: {
    borderColor: 'rgba(255, 255, 255, 0.2)',
    ...shadows.medium,
  },
  badge: {
    position: 'absolute',
    top: -1,
    right: 20,
    backgroundColor: colors.premiumGold,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs / 2,
    borderBottomLeftRadius: borderRadius.sm,
    borderBottomRightRadius: borderRadius.sm,
    zIndex: 1,
  },
  badgeText: {
    ...typography.caption,
    color: colors.background,
    fontWeight: '700',
    fontSize: 10,
  },
  gradient: {
    padding: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  content: {
    flex: 1,
  },
  planName: {
    ...typography.body,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: spacing.xs,
  },
  price: {
    ...typography.h2,
    color: colors.textPrimary,
    fontFamily: 'PlayfairDisplay_700Bold',
  },
  period: {
    ...typography.body,
    color: colors.textSecondary,
    marginLeft: spacing.xs,
  },
  savings: {
    ...typography.caption,
    color: colors.accentSecondary,
    fontWeight: '600',
  },
  selectedIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.accentPrimary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmark: {
    width: 8,
    height: 12,
    borderRightWidth: 2,
    borderBottomWidth: 2,
    borderColor: colors.white,
    transform: [{ rotate: '45deg' }],
    marginTop: -2,
  },
});
