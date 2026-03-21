import { View, Text, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { AnalysisResult } from '@/types';
import { appConfig } from '@/config/appConfig';
import { colors, typography, spacing, borderRadius, shadows } from '@/theme';

interface Props {
  result: AnalysisResult;
}

export function ResultCard({ result }: Props) {
  const { currencySymbol, labels } = appConfig.result;

  const formatValue = (value: number) => {
    return `${currencySymbol}${value.toLocaleString()}`;
  };

  return (
    <View style={styles.container}>
      {/* Item Image */}
      {result.imageUri && (
        <Image
          source={{ uri: result.imageUri }}
          style={styles.itemImage}
          contentFit="cover"
        />
      )}

      {/* Item Name */}
      <View style={styles.section}>
        <Text style={styles.label}>{labels.name}</Text>
        <Text style={styles.value}>{result.name}</Text>
      </View>

      {/* Origin & Year */}
      <View style={styles.row}>
        <View style={styles.halfSection}>
          <Text style={styles.label}>{labels.origin}</Text>
          <Text style={styles.value}>{result.origin}</Text>
        </View>
        <View style={styles.halfSection}>
          <Text style={styles.label}>{labels.year}</Text>
          <Text style={styles.value}>{result.year}</Text>
        </View>
      </View>

      {/* Estimated Value - Highlighted */}
      <View style={[styles.section, styles.valueSection]}>
        <Text style={styles.valueLabel}>{labels.estimatedValue}</Text>
        <Text style={styles.priceText}>{formatValue(result.estimatedValue)}</Text>
      </View>

      {/* Confidence */}
      <View style={styles.section}>
        <Text style={styles.label}>{labels.confidence}</Text>
        <View style={styles.confidenceBar}>
          <View
            style={[
              styles.confidenceFill,
              { width: `${result.confidence}%` },
            ]}
          />
          <Text style={styles.confidenceText}>{result.confidence}%</Text>
        </View>
      </View>

      {/* Description */}
      <View style={styles.section}>
        <Text style={styles.label}>{labels.description}</Text>
        <Text style={styles.description}>{result.description}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.backgroundSecondary,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    ...shadows.medium,
  },
  itemImage: {
    width: '100%',
    height: 200,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
  },
  section: {
    marginBottom: spacing.md,
  },
  row: {
    flexDirection: 'row',
    marginBottom: spacing.md,
  },
  halfSection: {
    flex: 1,
  },
  label: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  value: {
    ...typography.body,
    color: colors.text,
  },
  valueSection: {
    backgroundColor: colors.accentSecondary + '20',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  valueLabel: {
    ...typography.caption,
    color: colors.accentSecondary,
    marginBottom: spacing.xs,
    textTransform: 'uppercase',
    fontWeight: '700',
  },
  priceText: {
    ...typography.price,
    fontFamily: 'PlayfairDisplay_700Bold',
  },
  confidenceBar: {
    height: 32,
    backgroundColor: colors.border,
    borderRadius: borderRadius.sm,
    overflow: 'hidden',
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
  },
  confidenceFill: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.success,
  },
  confidenceText: {
    ...typography.body,
    fontWeight: '600',
    color: colors.text,
    zIndex: 1,
  },
  description: {
    ...typography.body,
    color: colors.text,
    lineHeight: 24,
  },
});
