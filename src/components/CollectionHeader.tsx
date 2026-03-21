import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { appConfig } from '@/config/appConfig';
import { colors, spacing } from '@/theme';

interface Props {
  totalValue: number;
  itemCount: number;
  originCount: number;
}

export function CollectionHeader({ totalValue, itemCount, originCount }: Props) {
  const { currencySymbol } = appConfig.result;
  const { collection } = appConfig;

  const formatValue = (value: number) => {
    return `${currencySymbol}${value.toLocaleString()}`;
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.value}>{formatValue(totalValue)}</Text>
        <Text style={styles.currencyLabel}>{collection.currencyLabel}</Text>

        {/* Stats — separate rows */}
        <View style={styles.statsColumn}>
          <View style={styles.statRow}>
            <Ionicons name="layers-outline" size={16} color={colors.textSecondary} />
            <Text style={styles.statText}>
              {itemCount} {itemCount === 1 ? 'Item' : 'Items'}
            </Text>
          </View>
          <View style={styles.statRow}>
            <Ionicons name="flag-outline" size={16} color={colors.textSecondary} />
            <Text style={styles.statText}>
              {originCount} {originCount === 1 ? 'Origin' : 'Origins'}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: spacing.lg,
    marginBottom: spacing.md,
  },
  content: {
    alignItems: 'center',
  },
  value: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 48,
    color: colors.textPrimary,
    fontWeight: '700',
  },
  currencyLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  statsColumn: {
    marginTop: spacing.lg,
    gap: spacing.sm,
    alignItems: 'center',
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  statText: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '600',
  },
});
