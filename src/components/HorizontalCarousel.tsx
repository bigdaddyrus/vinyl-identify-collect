import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { CarouselItem } from '@/types';
import { colors, typography, spacing, borderRadius } from '@/theme';
// Ionicons kept for onSeeAll chevron

interface Props {
  title: string;
  subtitle?: string;
  items: CarouselItem[];
  onSeeAll?: () => void;
  onItemPress?: (item: CarouselItem) => void;
}

export function HorizontalCarousel({ title, subtitle, items, onSeeAll, onItemPress }: Props) {
  const renderItem = ({ item, index }: { item: CarouselItem; index: number }) => (
    <TouchableOpacity style={styles.card} activeOpacity={0.8} onPress={() => onItemPress?.(item)}>
      <View style={styles.cardImage}>
        <Image
          source={item.image || { uri: `https://picsum.photos/seed/${item.id || index}/280/280` }}
          style={styles.image}
          contentFit="cover"
        />
      </View>
      <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
      {item.subtitle && (
        <Text style={styles.cardSubtitle} numberOfLines={1}>{item.subtitle}</Text>
      )}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        {onSeeAll && (
          <TouchableOpacity onPress={onSeeAll} activeOpacity={0.7}>
            <Ionicons name="chevron-forward" size={22} color={colors.textSecondary} />
          </TouchableOpacity>
        )}
      </View>
      {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      <FlatList
        data={items}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.sm,
  },
  title: {
    ...typography.h3,
    color: colors.textPrimary,
  },
  subtitle: {
    ...typography.caption,
    color: colors.textSecondary,
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.sm,
  },
  listContent: {
    paddingHorizontal: spacing.xl,
    gap: spacing.md,
  },
  card: {
    width: 140,
  },
  cardImage: {
    width: 140,
    height: 140,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  cardTitle: {
    ...typography.caption,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  cardSubtitle: {
    ...typography.caption,
    color: colors.textSecondary,
    fontSize: 12,
  },
});
