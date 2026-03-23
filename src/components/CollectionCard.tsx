import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { AnalysisResult } from '@/types';
import { colors, typography, spacing, borderRadius } from '@/theme';

/** Extract the short abbreviation from a condition string like "Near Mint (NM)" → "NM" */
function conditionShort(condition?: string): string | undefined {
  if (!condition) return undefined;
  const match = condition.match(/\(([^)]+)\)/);
  return match ? match[1] : condition;
}

interface Props {
  item: AnalysisResult;
  onPress?: () => void;
  onKebabPress?: () => void;
}

export function CollectionCard({ item, onPress, onKebabPress }: Props) {
  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {/* Item Image or Placeholder */}
      {item.imageUri ? (
        <Image
          source={{ uri: item.imageUri }}
          style={styles.itemImage}
          contentFit="cover"
        />
      ) : (
        <View style={styles.imagePlaceholder}>
          <Ionicons name="image" size={28} color={colors.border} />
        </View>
      )}

      {/* Content */}
      <View style={styles.content}>
        <Text style={styles.name} numberOfLines={2}>
          {item.name}
        </Text>
        {item.label && (
          <Text style={styles.label} numberOfLines={1}>
            {item.label}
          </Text>
        )}
        <Text style={styles.metadata} numberOfLines={1}>
          {[
            item.genre,
            conditionShort(item.condition),
            item.origin,
          ].filter(Boolean).join(' · ')}
        </Text>
      </View>

      {/* Kebab menu */}
      {onKebabPress && (
        <TouchableOpacity
          style={styles.kebabButton}
          onPress={(e) => {
            e.stopPropagation();
            onKebabPress();
          }}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          activeOpacity={0.5}
        >
          <Ionicons name="ellipsis-vertical" size={18} color={colors.textSecondary} />
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.borderSubtle,
  },
  itemImage: {
    width: 64,
    height: 64,
    borderRadius: borderRadius.sm,
    marginRight: spacing.md,
  },
  imagePlaceholder: {
    width: 64,
    height: 64,
    backgroundColor: colors.surfaceSubtle,
    borderRadius: borderRadius.sm,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  name: {
    ...typography.body,
    color: colors.textPrimary,
    fontWeight: '500',
    fontSize: 15,
    marginBottom: 2,
  },
  label: {
    ...typography.caption,
    color: colors.textTertiary,
    fontSize: 12,
    marginBottom: 1,
  },
  metadata: {
    ...typography.caption,
    color: colors.textSecondary,
    fontSize: 13,
  },
  kebabButton: {
    padding: spacing.sm,
    marginLeft: spacing.xs,
  },
});
