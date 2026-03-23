import { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Dimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import * as StoreReview from 'expo-store-review';
import { Ionicons } from '@expo/vector-icons';
import { GradientButton } from '@/components/GradientButton';
import { useAppStore } from '@/store/useAppStore';
import { appConfig } from '@/config/appConfig';
import { AnalysisResult, ExtendedDetailSection } from '@/types';
import { colors, spacing } from '@/theme';
import { triggerCollectionAdd, triggerButtonPress } from '@/utils/haptics';
import { getDisplayName } from '@/data/countryCoordinates';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const HERO_HEIGHT = SCREEN_HEIGHT * 0.38;

// ── Rarity Bar ──────────────────────────────────────────────
const RARITY_MAP: Record<string, number> = {
  'Very Common': 0.08,
  'Common': 0.22,
  'Uncommon': 0.40,
  'Rare': 0.60,
  'Very Rare': 0.78,
  'Extremely Rare': 0.95,
};

function RarityBar({ rarity }: { rarity: string }) {
  const position = RARITY_MAP[rarity] ?? 0.5;

  return (
    <View style={rarityStyles.container}>
      <View style={rarityStyles.labelRow}>
        <Ionicons name="diamond" size={14} color={colors.accentPrimary} />
        <Text style={rarityStyles.label}>{rarity}</Text>
      </View>
      <View style={rarityStyles.track}>
        <LinearGradient
          colors={[colors.success, colors.accentPrimary, colors.error]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={rarityStyles.gradient}
        />
        <View style={[rarityStyles.marker, { left: `${position * 100}%` }]} />
      </View>
    </View>
  );
}

const rarityStyles = StyleSheet.create({
  container: { marginTop: spacing.md },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.accentPrimary,
  },
  track: {
    height: 4,
    borderRadius: 2,
    overflow: 'visible',
    position: 'relative',
  },
  gradient: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 2,
  },
  marker: {
    position: 'absolute',
    top: -4,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.accentPrimary,
    borderWidth: 2,
    borderColor: colors.background,
    marginLeft: -6,
  },
});

// ── Pagination Dots ─────────────────────────────────────────
function PaginationDots({ count, activeIndex }: { count: number; activeIndex: number }) {
  if (count <= 1) return null;
  return (
    <View style={dotStyles.container}>
      {Array.from({ length: count }).map((_, i) => (
        <View
          key={i}
          style={[dotStyles.dot, i === activeIndex && dotStyles.dotActive]}
        />
      ))}
    </View>
  );
}

const dotStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    paddingVertical: spacing.sm,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.overlayMedium,
  },
  dotActive: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.accentPrimary,
  },
});

// ── Flat Detail Section ─────────────────────────────────────
function DetailSection({ section }: { section: ExtendedDetailSection }) {
  return (
    <View style={detailStyles.container}>
      <View style={detailStyles.header}>
        {section.icon && (
          <View style={detailStyles.iconBox}>
            <Ionicons name={section.icon as any} size={16} color={colors.accentPrimary} />
          </View>
        )}
        <Text style={detailStyles.title}>{section.title}</Text>
      </View>
      <View style={detailStyles.content}>
        {section.items.map((item, index) => (
          <View
            key={index}
            style={[
              detailStyles.row,
              index < section.items.length - 1 && detailStyles.rowBorder,
            ]}
          >
            <Text style={detailStyles.label}>{item.label}</Text>
            <Text style={detailStyles.value}>{item.value}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const detailStyles = StyleSheet.create({
  container: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.borderSubtle,
  },
  iconBox: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: colors.accentHighlight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  content: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
  },
  row: {
    paddingVertical: 12,
  },
  rowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.borderSubtle,
  },
  label: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.textMuted,
    marginBottom: 4,
  },
  value: {
    fontSize: 15,
    fontWeight: '400',
    color: colors.white,
    lineHeight: 21,
  },
});

// ── Feedback Widget ─────────────────────────────────────────
function FeedbackWidget() {
  const [rating, setRating] = useState(0);
  const [submitted, setSubmitted] = useState(false);

  if (submitted) {
    return (
      <View style={feedbackStyles.container}>
        <Text style={feedbackStyles.thankYou}>Thank you for your feedback!</Text>
      </View>
    );
  }

  return (
    <View style={feedbackStyles.container}>
      <Text style={feedbackStyles.question}>
        Were you satisfied with the information on this page?
      </Text>
      <View style={feedbackStyles.stars}>
        {[1, 2, 3, 4, 5].map((star) => (
          <TouchableOpacity
            key={star}
            onPress={() => {
              setRating(star);
              setSubmitted(true);
            }}
            activeOpacity={0.7}
          >
            <Ionicons
              name={star <= rating ? 'star' : 'star-outline'}
              size={28}
              color={colors.accentPrimary}
            />
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const feedbackStyles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.xl,
  },
  question: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textMuted,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  stars: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  thankYou: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.accentPrimary,
  },
});

// ── Main Result Screen ──────────────────────────────────────
export default function ResultScreen() {
  const params = useLocalSearchParams();
  const addToCollection = useAppStore((state) => state.addToCollection);
  const removeFromCollection = useAppStore((state) => state.removeFromCollection);
  const hasTriggeredReview = useAppStore((state) => state.hasTriggeredReview);
  const collection = useAppStore((state) => state.collection);

  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [pendingSave, setPendingSave] = useState(false);

  const onImageScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const index = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
      setActiveImageIndex(index);
    },
    []
  );

  // Parse result data from params
  const paramResult: AnalysisResult | null = params.resultData
    ? JSON.parse(params.resultData as string)
    : null;

  if (!paramResult) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.errorText}>Error: No result data found</Text>
      </SafeAreaView>
    );
  }

  // For items already in collection, read live data from store
  const storeItem = collection.find((i) => i.id === paramResult.id);
  const isInCollection = !!storeItem;
  const item = storeItem ?? paramResult;

  const { currencySymbol, upsellCta, showFeedback } = appConfig.result;

  // Build image array from either images[] or legacy imageUri
  const imageList: string[] = item.images?.length
    ? item.images
    : item.imageUri
      ? [item.imageUri]
      : [];

  // ── Value formatting ──
  const formatValue = (value: number) => {
    if (value >= 1000000) {
      return `${currencySymbol}${(value / 1000000).toFixed(2)}M`;
    }
    if (value >= 1000) {
      return `${currencySymbol}${(value / 1000).toFixed(1)}K`;
    }
    return `${currencySymbol}${value.toLocaleString()}`;
  };

  const priceDisplay = () => {
    if (item.estimatedValueLow != null && item.estimatedValueHigh != null) {
      return `${formatValue(item.estimatedValueLow)} – ${formatValue(item.estimatedValueHigh)}`;
    }
    return formatValue(item.estimatedValue);
  };

  // ── Actions ──
  const handleAddToCollection = () => {
    triggerButtonPress();

    if (pendingSave) {
      // Already saved temporarily for editing — just confirm and go home
      setPendingSave(false);
    } else {
      const itemToSave: AnalysisResult = {
        ...item,
        collectionDate: Date.now(),
      };
      addToCollection(itemToSave);
    }

    triggerCollectionAdd();

    if (
      !hasTriggeredReview &&
      item.estimatedValue > appConfig.aso.reviewThresholdValue
    ) {
      setTimeout(async () => {
        const isAvailable = await StoreReview.isAvailableAsync();
        if (isAvailable) {
          await StoreReview.requestReview();
        }
      }, 1500);
    }

    router.navigate('/(tabs)/(home)');
  };

  const handleRemove = () => {
    triggerButtonPress();
    Alert.alert(
      'Remove Item',
      `Remove "${item.name}" from your collection?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            removeFromCollection(item.id);
            router.back();
          },
        },
      ]
    );
  };

  const handleScanNew = () => {
    triggerButtonPress();
    router.navigate('/(tabs)/(scanner)');
  };

  const handleShare = () => {
    triggerButtonPress();
    router.push({
      pathname: '/(tabs)/(scanner)/share',
      params: { itemData: JSON.stringify(item) },
    });
  };

  const handleBack = () => {
    triggerButtonPress();
    if (pendingSave) {
      // Remove temporarily saved item if user backs out without saving
      removeFromCollection(item.id);
    }
    router.back();
  };

  const handleEdit = () => {
    triggerButtonPress();
    if (!isInCollection) {
      // Temporarily save so the edit modal can update it via store
      addToCollection({ ...item, collectionDate: Date.now() });
      setPendingSave(true);
    }
    router.push({
      pathname: '/(tabs)/(scanner)/edit',
      params: { itemData: JSON.stringify(item) },
    });
  };

  const handleHeaderKebab = () => {
    triggerButtonPress();
    const options: { text: string; onPress?: () => void; style?: 'destructive' | 'cancel' }[] = [
      { text: 'Edit', onPress: handleEdit },
    ];

    if (isInCollection && !pendingSave) {
      options.push({
        text: 'Delete from Collection',
        style: 'destructive',
        onPress: () => {
          Alert.alert(
            'Delete Item',
            `Remove "${item.name}" from your collection?`,
            [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Delete',
                style: 'destructive',
                onPress: () => {
                  removeFromCollection(item.id);
                  router.back();
                },
              },
            ]
          );
        },
      });
    }

    options.push({ text: 'Cancel', style: 'cancel' });
    Alert.alert(item.name, undefined, options);
  };

  // Format collection date
  const collectionDateStr = item.collectionDate
    ? new Date(item.collectionDate).toLocaleDateString('en-US')
    : item.createdAt
      ? new Date(item.createdAt).toLocaleDateString('en-US')
      : undefined;

  return (
    <View style={styles.container}>
      {/* ── Header Bar ── */}
      <SafeAreaView edges={['top']} style={styles.headerSafe}>
        <View style={styles.headerBar}>
          <TouchableOpacity style={styles.headerButton} onPress={handleBack} activeOpacity={0.7}>
            <Ionicons name="chevron-back" size={24} color={colors.white} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerButton} onPress={handleHeaderKebab} activeOpacity={0.7}>
            <Ionicons name="ellipsis-vertical" size={20} color={colors.white} />
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Hero Image Carousel ── */}
        <View style={styles.heroSection}>
          <LinearGradient
            colors={[colors.accentSurface, 'transparent']}
            style={styles.heroGradient}
            pointerEvents="none"
          />

          {imageList.length > 0 ? (
            <ScrollView
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={onImageScroll}
              style={styles.carousel}
            >
              {imageList.map((uri, i) => (
                <View key={`img-${i}`} style={styles.carouselItem}>
                  <Image source={{ uri }} style={styles.carouselImage} contentFit="contain" />
                </View>
              ))}
            </ScrollView>
          ) : (
            <View style={styles.heroPlaceholder}>
              <Ionicons name="image-outline" size={64} color={colors.overlayLight} />
            </View>
          )}

          {/* Confidence badge */}
          {item.confidence > 0 && (
            <View style={styles.confidenceBadge}>
              <Ionicons name="analytics" size={12} color={colors.white} />
              <Text style={styles.confidenceText}>Confidence {item.confidence}%</Text>
            </View>
          )}
        </View>

        {/* Pagination dots */}
        <PaginationDots count={imageList.length} activeIndex={activeImageIndex} />

        {/* ── Core Information (Read-Only) ── */}
        <View style={styles.infoSection}>
          {/* Name */}
          <Text style={styles.itemName}>{item.name}</Text>

          {/* Genre, Label, Origin, Year chips */}
          <View style={styles.chipRow}>
            {item.genre && (
              <View style={styles.chip}>
                <Ionicons name="musical-notes" size={12} color={colors.iconMuted} />
                <Text style={styles.chipText}>{item.genre}</Text>
              </View>
            )}
            {item.label && (
              <View style={styles.chip}>
                <Ionicons name="disc" size={12} color={colors.iconMuted} />
                <Text style={styles.chipText}>{item.label}</Text>
              </View>
            )}
            <View style={styles.chip}>
              <Ionicons name="flag" size={12} color={colors.iconMuted} />
              <Text style={styles.chipText}>{getDisplayName(item.origin)}</Text>
            </View>
            <View style={styles.chip}>
              <Ionicons name="calendar" size={12} color={colors.iconMuted} />
              <Text style={styles.chipText}>{item.year}</Text>
            </View>
          </View>

          {/* Key-value rows: Grade, Date */}
          {(item.condition || collectionDateStr) && (
            <View style={styles.detailRows}>
              {item.condition && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailRowLabel}>Grade</Text>
                  <Text style={styles.detailRowValue}>{item.condition}</Text>
                </View>
              )}
              {collectionDateStr && isInCollection && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailRowLabel}>Date</Text>
                  <Text style={styles.detailRowValue}>{collectionDateStr}</Text>
                </View>
              )}
            </View>
          )}

          {/* Estimated Value */}
          <View style={styles.priceCard}>
            <Text style={styles.priceLabel}>
              {appConfig.result.labels.estimatedValue ?? 'Estimated Value'}
            </Text>
            <Text style={styles.priceValue}>{priceDisplay()}</Text>
          </View>

          {/* Rarity Bar */}
          {item.rarity && <RarityBar rarity={item.rarity} />}
        </View>

        {/* ── Upsell CTA ── */}
        {upsellCta?.enabled && (
          <View style={styles.upsellSection}>
            <TouchableOpacity style={styles.upsellButton} activeOpacity={0.7}>
              {upsellCta.icon && (
                <Ionicons name={upsellCta.icon as any} size={18} color={colors.accentPrimary} />
              )}
              <View style={styles.upsellTextWrap}>
                <Text style={styles.upsellTitle}>{upsellCta.text}</Text>
                {upsellCta.subtitle && (
                  <Text style={styles.upsellSubtitle}>{upsellCta.subtitle}</Text>
                )}
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.iconSubtle} />
            </TouchableOpacity>
          </View>
        )}

        {/* ── Description ── */}
        <View style={styles.descriptionSection}>
          <Text style={styles.descriptionText}>{item.description}</Text>
        </View>

        {/* ── Detail Sections (flat, always visible) ── */}
        {item.extendedDetails && item.extendedDetails.length > 0 && (
          <View style={styles.detailsSection}>
            {item.extendedDetails.map((section, index) => (
              <DetailSection key={index} section={section} />
            ))}
          </View>
        )}

        {/* ── Feedback ── */}
        {showFeedback && <FeedbackWidget />}

        {/* Spacer for sticky bottom bar */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* ── Sticky Bottom Action Bar ── */}
      <View style={styles.bottomBar}>
        <View style={styles.bottomBarInner}>
          <SafeAreaView edges={['bottom']} style={styles.bottomBarContent}>
            {/* Secondary actions */}
            <View style={styles.secondaryActions}>
              <TouchableOpacity style={styles.iconButton} onPress={handleScanNew} activeOpacity={0.7}>
                <Ionicons name="camera" size={22} color={colors.white} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.iconButton} onPress={handleShare} activeOpacity={0.7}>
                <Ionicons name="share-outline" size={22} color={colors.white} />
              </TouchableOpacity>
            </View>

            {/* Primary CTA */}
            <View style={styles.primaryAction}>
              {isInCollection && !pendingSave ? (
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={handleRemove}
                  activeOpacity={0.8}
                >
                  <Text style={styles.removeButtonText}>Remove</Text>
                </TouchableOpacity>
              ) : (
                <GradientButton
                  text="Save to Collection"
                  onPress={handleAddToCollection}
                  icon="add"
                />
              )}
            </View>
          </SafeAreaView>
        </View>
      </View>
    </View>
  );
}

// ── Styles ──────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingBottom: spacing.xl,
  },
  errorText: {
    fontSize: 16,
    color: colors.error,
    textAlign: 'center',
    padding: spacing.xl,
    marginTop: spacing.xxl,
  },

  // ── Hero ──
  heroSection: {
    height: HERO_HEIGHT,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  heroGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  carousel: {
    width: SCREEN_WIDTH,
    height: HERO_HEIGHT,
  },
  carouselItem: {
    width: SCREEN_WIDTH,
    height: HERO_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  carouselImage: {
    width: SCREEN_WIDTH * 0.65,
    height: HERO_HEIGHT * 0.75,
  },
  heroPlaceholder: {
    width: SCREEN_WIDTH * 0.65,
    height: HERO_HEIGHT * 0.75,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceElevated,
    borderRadius: 16,
  },
  headerSafe: {
    backgroundColor: colors.background,
    zIndex: 10,
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confidenceBadge: {
    position: 'absolute',
    bottom: spacing.md,
    right: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.overlayLight,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  confidenceText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.white,
  },

  // ── Core Info ──
  infoSection: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
  },
  itemName: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.textPrimary,
    letterSpacing: -0.3,
    marginBottom: spacing.sm,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.surfaceSubtle,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.textBody,
  },
  detailRows: {
    marginBottom: spacing.lg,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.borderSubtle,
  },
  detailRowLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textMuted,
  },
  detailRowValue: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textPrimary,
  },
  priceCard: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    alignItems: 'center',
  },
  priceLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  priceValue: {
    fontSize: 32,
    fontWeight: '700',
    fontFamily: 'PlayfairDisplay_700Bold',
    color: colors.textPrimary,
  },

  // ── Upsell CTA ──
  upsellSection: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
  },
  upsellButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.accentSurface,
    borderWidth: 1,
    borderColor: colors.accentBorder,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  upsellTextWrap: {
    flex: 1,
  },
  upsellTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.accentPrimary,
  },
  upsellSubtitle: {
    fontSize: 12,
    fontWeight: '400',
    color: colors.textMuted,
    marginTop: 2,
  },

  // ── Description ──
  descriptionSection: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  descriptionText: {
    fontSize: 15,
    fontWeight: '400',
    color: colors.textBody,
    lineHeight: 22,
  },

  // ── Detail Sections ──
  detailsSection: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.sm,
  },

  // ── Sticky Bottom Bar ──
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  bottomBarInner: {
    backgroundColor: colors.background,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.borderSubtle,
    overflow: 'hidden',
  },
  bottomBarContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  secondaryActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginRight: spacing.md,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.border,
    borderWidth: 1,
    borderColor: colors.overlayLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryAction: {
    flex: 1,
  },
  removeButton: {
    backgroundColor: colors.errorSurface,
    borderWidth: 1,
    borderColor: colors.errorBorderLight,
    borderRadius: 16,
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.error,
  },
});
