import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { AnalysisResult } from '@/types';
import { appConfig } from '@/config/appConfig';
import { colors, typography, spacing, borderRadius, shadows } from '@/theme';
import { getDisplayName } from '@/data/countryCoordinates';

interface Props {
  item: AnalysisResult;
  onPress?: () => void;
}

export function BestItemCard({ item, onPress }: Props) {
  const { currencySymbol } = appConfig.result;

  const formatValue = (value: number) => {
    return `${currencySymbol}${value.toLocaleString()}`;
  };

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.9}
      disabled={!onPress}
    >
      <LinearGradient
        colors={[colors.gradientStart, colors.gradientEnd]}
        style={styles.gradient}
      >
        {/* Item Image */}
        {item.imageUri && (
          <Image
            source={{ uri: item.imageUri }}
            style={styles.itemImage}
            contentFit="cover"
          />
        )}

        {/* Content Overlay */}
        <View style={styles.overlay}>
          <View style={styles.content}>
            <Text style={styles.name} numberOfLines={2}>
              {item.name}
            </Text>
            <Text style={styles.metadata}>
              {getDisplayName(item.origin)} • {item.year}
            </Text>
          </View>

          {/* Value Badge */}
          <View style={styles.valueBadge}>
            <Text style={styles.value}>{formatValue(item.estimatedValue)}</Text>
            <Text style={styles.confidenceText}>{item.confidence}% confidence</Text>
          </View>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 280,
    marginRight: spacing.md,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    ...shadows.medium,
  },
  gradient: {
    width: '100%',
    height: '100%',
  },
  itemImage: {
    width: '100%',
    height: 200,
  },
  overlay: {
    padding: spacing.lg,
  },
  content: {
    marginBottom: spacing.md,
  },
  name: {
    ...typography.h3,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  metadata: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  valueBadge: {
    backgroundColor: colors.backgroundSecondary + 'CC',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  value: {
    ...typography.price,
    color: colors.accentSecondary,
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 28,
    marginBottom: spacing.xs,
  },
  confidenceText: {
    ...typography.caption,
    color: colors.textSecondary,
  },
});
