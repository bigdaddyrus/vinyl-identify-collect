import { useEffect, useRef, useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, FlatList, ViewToken } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { AnalysisResult } from '@/types';
import { appConfig } from '@/config/appConfig';
import { colors, typography, spacing, borderRadius } from '@/theme';

interface SpotlightItem {
  label: string;
  item: AnalysisResult | null;
}

interface Props {
  items: SpotlightItem[];
  onItemPress: (item: AnalysisResult) => void;
}

const AUTOPLAY_INTERVAL = 4000;

export function SpotlightCarousel({ items, onItemPress }: Props) {
  const labels = appConfig.collection.spotlightLabels;
  const { currencySymbol } = appConfig.result;
  const visibleItems = items.filter((i) => i.item !== null) as { label: string; item: AnalysisResult }[];
  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  const screenWidth = Dimensions.get('window').width;
  const cardWidth = screenWidth - spacing.md * 2; // matches parent padding

  const onViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    if (viewableItems.length > 0 && viewableItems[0].index !== null) {
      setActiveIndex(viewableItems[0].index);
    }
  }).current;

  const viewabilityConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

  const goToNext = useCallback(() => {
    if (!flatListRef.current || visibleItems.length <= 1) {
      return;
    }

    const nextIndex = (activeIndex + 1) % visibleItems.length;

    try {
      flatListRef.current.scrollToIndex({ index: nextIndex, animated: true });
    } catch {
      // In case the list is not ready or index is temporarily out of range, ignore.
    }
  }, [activeIndex, visibleItems.length]);

  useEffect(() => {
    if (visibleItems.length <= 1) {
      return;
    }

    const intervalId = setInterval(goToNext, AUTOPLAY_INTERVAL);

    return () => clearInterval(intervalId);
  }, [visibleItems.length, goToNext]);

  if (visibleItems.length === 0) return null;

  const formatValue = (value: number) => `${currencySymbol}${value.toLocaleString()}`;

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{labels?.title ?? 'Your Best Items'}</Text>

      <FlatList
        ref={flatListRef}
        data={visibleItems}
        keyExtractor={(_, i) => String(i)}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        getItemLayout={(_, index) => ({
          length: cardWidth,
          offset: cardWidth * index,
          index,
        })}
        snapToInterval={cardWidth}
        decelerationRate="fast"
        renderItem={({ item: { label, item } }) => (
          <TouchableOpacity
            style={[styles.card, { width: cardWidth }]}
            onPress={() => onItemPress(item)}
            activeOpacity={0.8}
          >
            {/* Item name */}
            <Text style={styles.name} numberOfLines={2}>{item.name}</Text>

            {/* Large centered item image */}
            {(item.imageUri || item.discogsImage || item.discogsThumbnail) ? (
              <Image
                source={{ uri: item.imageUri || item.discogsImage || item.discogsThumbnail }}
                style={styles.image}
                contentFit="contain"
              />
            ) : (
              <View style={styles.imagePlaceholder}>
                <Ionicons name="image" size={48} color={colors.border} />
              </View>
            )}

            {/* Category label + year */}
            <Text style={styles.subtitle}>{label} · {item.year}</Text>

            {/* Value in gold serif */}
            <Text style={styles.value}>{formatValue(item.estimatedValue)}</Text>
          </TouchableOpacity>
        )}
      />

      {/* Dot indicators */}
      {visibleItems.length > 1 && (
        <View style={styles.dots}>
          {visibleItems.map((_, i) => (
            <View
              key={i}
              style={[styles.dot, i === activeIndex && styles.dotActive]}
            />
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  card: {
    backgroundColor: colors.surfaceSubtle,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    alignItems: 'center',
  },
  name: {
    ...typography.body,
    color: colors.textPrimary,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  image: {
    width: '100%',
    height: 200,
    marginBottom: spacing.md,
  },
  imagePlaceholder: {
    width: '100%',
    height: 200,
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  subtitle: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  value: {
    fontSize: 28,
    fontFamily: 'PlayfairDisplay_700Bold',
    color: colors.accentSecondary,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.border,
  },
  dotActive: {
    backgroundColor: colors.accentPrimary,
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
