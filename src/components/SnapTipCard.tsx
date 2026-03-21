import { View, Text, StyleSheet, ImageSourcePropType } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius } from '@/theme';

interface Props {
  type: 'good' | 'bad';
  image: ImageSourcePropType;
  caption: string;
  variant?: 'large' | 'small';
}

export function SnapTipCard({ type, image, caption, variant = 'large' }: Props) {
  const isGood = type === 'good';
  const iconColor = isGood ? colors.success : colors.error;
  const iconName = isGood ? 'checkmark-circle' : 'close-circle';
  const bgColor = isGood ? colors.white : colors.backgroundSecondary;

  if (variant === 'small') {
    return (
      <View style={styles.smallContainer}>
        <Image source={image} style={styles.smallImage} contentFit="cover" />
        <View style={styles.smallOverlay}>
          <Ionicons name={iconName} size={20} color={iconColor} />
        </View>
        <Text style={styles.smallCaption}>{caption}</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: bgColor }]}>
      <Image source={image} style={styles.image} contentFit="cover" />
      <View style={styles.bottomRow}>
        <Ionicons name={iconName} size={24} color={iconColor} />
        <Text style={[styles.caption, isGood && styles.captionDark]}>{caption}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // Large variant
  container: {
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    marginBottom: spacing.md,
  },
  image: {
    width: '100%',
    aspectRatio: 16 / 10,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    gap: spacing.sm,
  },
  caption: {
    ...typography.body,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  captionDark: {
    color: colors.background,
  },
  // Small variant
  smallContainer: {
    flex: 1,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    backgroundColor: colors.backgroundSecondary,
  },
  smallImage: {
    width: '100%',
    aspectRatio: 1,
  },
  smallOverlay: {
    position: 'absolute',
    top: spacing.xs,
    right: spacing.xs,
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: spacing.xs / 2,
    borderRadius: borderRadius.round,
  },
  smallCaption: {
    ...typography.caption,
    color: colors.textSecondary,
    padding: spacing.xs,
    textAlign: 'center',
    fontSize: 11,
  },
});
