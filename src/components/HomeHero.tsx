import { View, Text, StyleSheet, ImageSourcePropType, DimensionValue } from 'react-native';
import { Image } from 'expo-image';
import { colors, typography, spacing } from '@/theme';

interface Props {
  title: string;
  subtitle: string;
  image?: ImageSourcePropType;
  height?: DimensionValue;
  variant?: 'default' | 'emptyState';
}

export function HomeHero({ title, subtitle, image, height = '40%', variant = 'default' }: Props) {
  if (variant === 'emptyState') {
    return (
      <View style={styles.emptyContainer}>
        {image ? (
          <Image source={image} style={styles.emptyImage} contentFit="contain" />
        ) : (
          <View style={styles.emptyImagePlaceholder} />
        )}
        <Text style={styles.emptyTitle}>{title}</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { height }]}>
      {image && (
        <Image
          source={image}
          style={styles.image}
          contentFit="contain"
        />
      )}
      <View style={styles.textContainer}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xxl,
  },
  image: {
    width: 200,
    height: 200,
    marginBottom: spacing.lg,
  },
  textContainer: {
    alignItems: 'center',
  },
  title: {
    fontSize: 36,
    fontWeight: '800',
    color: colors.text,
    marginBottom: spacing.sm,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  // Empty state variant — no solid circles, just the image floating on the glow
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.xl,
  },
  emptyImage: {
    width: 160,
    height: 160,
    marginBottom: spacing.lg,
  },
  emptyImagePlaceholder: {
    width: 160,
    height: 160,
    marginBottom: spacing.lg,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.textPrimary,
    textAlign: 'center',
  },
});
