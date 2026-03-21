import { View, Text, StyleSheet } from 'react-native';
import { colors, typography, spacing } from '@/theme';
import { visualFeatures } from '@/theme';
import { LaurelWreath } from './LaurelWreath';

interface StatItem {
  icon?: string;
  value: string;
  label?: string;
}

interface Props {
  stats: StatItem[];
  showWreaths?: boolean;
}

export function StatsDisplay({ stats, showWreaths = visualFeatures.showLaurelWreaths }: Props) {
  return (
    <View style={styles.container}>
      {showWreaths && (
        <LaurelWreath position="left" style={styles.wreathLeft} />
      )}

      <View style={styles.statsRow}>
        {stats.map((stat, index) => (
          <View key={index} style={styles.statItem}>
            <Text style={styles.statValue}>{stat.value}</Text>
            {stat.label && <Text style={styles.statLabel}>{stat.label}</Text>}
          </View>
        ))}
      </View>

      {showWreaths && (
        <LaurelWreath position="right" style={styles.wreathRight} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.lg,
    position: 'relative',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xl,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    ...typography.h3,
    color: colors.text,
    marginBottom: spacing.xs / 2,
  },
  statLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    fontSize: 11,
  },
  wreathLeft: {
    position: 'absolute',
    left: 0,
  },
  wreathRight: {
    position: 'absolute',
    right: 0,
  },
});
