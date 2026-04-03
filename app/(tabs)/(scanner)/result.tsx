import { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Dimensions,
  Modal,
  StatusBar,
  Linking,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import * as StoreReview from 'expo-store-review';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { scanFromURLAsync } from 'expo-camera';
import { GradientButton } from '@/components/GradientButton';
import { SetPickerModal } from '@/components/SetPickerModal';
import { useAppStore } from '@/store/useAppStore';
import { appConfig } from '@/config/appConfig';
import { AnalysisResult, ExtendedDetailSection, DiscogsTrackEntry, DiscogsCompanyEntry, DiscogsExtraArtistEntry } from '@/types';
import { colors, spacing } from '@/theme';
import { triggerCollectionAdd, triggerButtonPress } from '@/utils/haptics';
import { showSuccessToast } from '@/components/SuccessToast';
import { getDisplayName } from '@/data/countryCoordinates';
import { File } from 'expo-file-system';
import { searchByBarcode } from '@/services/discogs';
import { buildDiscogsUpdates } from '@/utils/mergeDiscogs';

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

// ── Accordion Section ──────────────────────────────────────
function AccordionSection({
  title,
  icon,
  children,
  defaultOpen = false,
}: {
  title: string;
  icon: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <View style={accordionStyles.container}>
      <TouchableOpacity
        style={accordionStyles.header}
        onPress={() => setOpen((prev) => !prev)}
        activeOpacity={0.7}
      >
        <View style={accordionStyles.headerLeft}>
          <View style={detailStyles.iconBox}>
            <Ionicons name={icon as any} size={16} color={colors.accentPrimary} />
          </View>
          <Text style={detailStyles.title}>{title}</Text>
        </View>
        <Ionicons
          name={open ? 'chevron-up' : 'chevron-down'}
          size={18}
          color={colors.textMuted}
        />
      </TouchableOpacity>
      {open && <View style={accordionStyles.content}>{children}</View>}
    </View>
  );
}

const accordionStyles = StyleSheet.create({
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
    justifyContent: 'space-between',
    padding: spacing.md,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  content: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.borderSubtle,
  },
});

// ── Tracklist Accordion ─────────────────────────────────────
function TracklistAccordion({ tracks }: { tracks: DiscogsTrackEntry[] }) {
  return (
    <AccordionSection title="Tracklist" icon="list">
      {tracks.map((track, index) => (
        <View
          key={`${track.position}-${track.title}`}
          style={[
            tracklistStyles.row,
            index < tracks.length - 1 && tracklistStyles.rowBorder,
          ]}
        >
          <Text style={tracklistStyles.position}>{track.position}</Text>
          <Text style={tracklistStyles.title} numberOfLines={2}>{track.title}</Text>
          {track.duration ? (
            <Text style={tracklistStyles.duration}>{track.duration}</Text>
          ) : null}
        </View>
      ))}
    </AccordionSection>
  );
}

const tracklistStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    gap: spacing.sm,
  },
  rowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.borderSubtle,
  },
  position: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textMuted,
    width: 28,
  },
  title: {
    flex: 1,
    fontSize: 14,
    fontWeight: '400',
    color: colors.textPrimary,
    lineHeight: 20,
  },
  duration: {
    fontSize: 13,
    fontWeight: '400',
    color: colors.textMuted,
    marginLeft: spacing.sm,
  },
});

// ── Companies Accordion ─────────────────────────────────────
function CompaniesAccordion({ companies }: { companies: DiscogsCompanyEntry[] }) {
  return (
    <AccordionSection title="Companies" icon="business">
      {companies.map((company, index) => (
        <View
          key={`${company.role}-${company.name}-${company.catno || index}`}
          style={[
            companiesStyles.row,
            index < companies.length - 1 && companiesStyles.rowBorder,
          ]}
        >
          <Text style={companiesStyles.role}>{company.role}</Text>
          <Text style={companiesStyles.name}>{company.name}</Text>
        </View>
      ))}
    </AccordionSection>
  );
}

// ── Extra Artists Accordion ─────────────────────────────────
function ExtraArtistsAccordion({ artists }: { artists: DiscogsExtraArtistEntry[] }) {
  return (
    <AccordionSection title="Credits" icon="people">
      {artists.map((artist, index) => (
        <View
          key={`${artist.role}-${artist.name}`}
          style={[
            companiesStyles.row,
            index < artists.length - 1 && companiesStyles.rowBorder,
          ]}
        >
          <Text style={companiesStyles.role}>{artist.role}</Text>
          <Text style={companiesStyles.name}>{artist.name}</Text>
        </View>
      ))}
    </AccordionSection>
  );
}

const companiesStyles = StyleSheet.create({
  row: {
    paddingVertical: 10,
  },
  rowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.borderSubtle,
  },
  role: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  name: {
    fontSize: 14,
    fontWeight: '400',
    color: colors.textPrimary,
  },
});

// ── Marketplace Info ────────────────────────────────────────
function MarketplaceInfo({
  lowestPrice,
  numForSale,
  communityHave,
  communityWant,
  discogsUrl,
}: {
  lowestPrice?: number;
  numForSale?: number;
  communityHave?: number;
  communityWant?: number;
  discogsUrl?: string;
}) {
  const hasMarketplace = lowestPrice != null || numForSale != null;
  const hasCommunity = communityHave != null || communityWant != null;
  if (!hasMarketplace && !hasCommunity) return null;

  return (
    <View style={marketStyles.container}>
      <View style={marketStyles.header}>
        <View style={detailStyles.iconBox}>
          <Ionicons name="storefront" size={16} color={colors.accentPrimary} />
        </View>
        <Text style={detailStyles.title}>Discogs Marketplace</Text>
      </View>
      <View style={marketStyles.grid}>
        {lowestPrice != null && (
          <View style={marketStyles.stat}>
            <Text style={marketStyles.statValue}>${lowestPrice.toFixed(2)}</Text>
            <Text style={marketStyles.statLabel}>Lowest Price</Text>
          </View>
        )}
        {numForSale != null && (
          <View style={marketStyles.stat}>
            <Text style={marketStyles.statValue}>{numForSale.toLocaleString()}</Text>
            <Text style={marketStyles.statLabel}>For Sale</Text>
          </View>
        )}
        {communityHave != null && (
          <View style={marketStyles.stat}>
            <Text style={marketStyles.statValue}>{communityHave.toLocaleString()}</Text>
            <Text style={marketStyles.statLabel}>Have</Text>
          </View>
        )}
        {communityWant != null && (
          <View style={marketStyles.stat}>
            <Text style={marketStyles.statValue}>{communityWant.toLocaleString()}</Text>
            <Text style={marketStyles.statLabel}>Want</Text>
          </View>
        )}
      </View>
      {discogsUrl && (
        <TouchableOpacity
          style={marketStyles.linkButton}
          onPress={async () => {
            try {
              const supported = await Linking.canOpenURL(discogsUrl);
              if (supported) {
                await Linking.openURL(discogsUrl);
              } else {
                Alert.alert('Cannot Open Link', 'Unable to open this Discogs URL.');
              }
            } catch {
              Alert.alert('Error', 'Failed to open the link.');
            }
          }}
          activeOpacity={0.7}
        >
          <Ionicons name="open-outline" size={16} color={colors.accentPrimary} />
          <Text style={marketStyles.linkText}>View on Discogs</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const marketStyles = StyleSheet.create({
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
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
  },
  stat: {
    width: '50%',
    paddingBottom: spacing.md,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    fontFamily: 'PlayfairDisplay_700Bold',
    color: colors.textPrimary,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 2,
  },
  linkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: 12,
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.accentBorder,
    backgroundColor: colors.accentSurface,
  },
  linkText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.accentPrimary,
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

// ── Fullscreen Image Viewer ──────────────────────────────────
const AnimatedImage = Animated.createAnimatedComponent(Image);

function FullscreenViewer({
  visible,
  uri,
  onClose,
}: {
  visible: boolean;
  uri: string;
  onClose: () => void;
}) {
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedTranslateX = useSharedValue(0);
  const savedTranslateY = useSharedValue(0);

  const resetTransform = () => {
    scale.value = withTiming(1);
    translateX.value = withTiming(0);
    translateY.value = withTiming(0);
    savedScale.value = 1;
    savedTranslateX.value = 0;
    savedTranslateY.value = 0;
  };

  const pinch = Gesture.Pinch()
    .onStart(() => {
      savedScale.value = scale.value;
    })
    .onUpdate((e) => {
      scale.value = Math.max(1, Math.min(5, savedScale.value * e.scale));
    })
    .onEnd(() => {
      if (scale.value < 1.1) {
        scale.value = withTiming(1);
        translateX.value = withTiming(0);
        translateY.value = withTiming(0);
        savedScale.value = 1;
        savedTranslateX.value = 0;
        savedTranslateY.value = 0;
      } else {
        savedScale.value = scale.value;
      }
    });

  const pan = Gesture.Pan()
    .onStart(() => {
      savedTranslateX.value = translateX.value;
      savedTranslateY.value = translateY.value;
    })
    .onUpdate((e) => {
      if (scale.value > 1) {
        translateX.value = savedTranslateX.value + e.translationX;
        translateY.value = savedTranslateY.value + e.translationY;
      }
    });

  const doubleTap = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd(() => {
      if (scale.value > 1.5) {
        scale.value = withTiming(1);
        translateX.value = withTiming(0);
        translateY.value = withTiming(0);
        savedScale.value = 1;
        savedTranslateX.value = 0;
        savedTranslateY.value = 0;
      } else {
        scale.value = withTiming(3);
        savedScale.value = 3;
      }
    });

  const composed = Gesture.Simultaneous(pinch, pan, doubleTap);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  const handleClose = () => {
    resetTransform();
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent>
      <StatusBar barStyle="light-content" />
      <GestureHandlerRootView style={fullscreenStyles.container}>
        <TouchableOpacity
          style={fullscreenStyles.closeButton}
          onPress={handleClose}
          activeOpacity={0.7}
        >
          <Ionicons name="close" size={28} color={colors.white} />
        </TouchableOpacity>
        <GestureDetector gesture={composed}>
          <AnimatedImage
            source={{ uri }}
            style={[fullscreenStyles.image, animatedStyle]}
            contentFit="contain"
          />
        </GestureDetector>
      </GestureHandlerRootView>
    </Modal>
  );
}

const fullscreenStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 56,
    right: 20,
    zIndex: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT * 0.8,
  },
});

// ── Main Result Screen ──────────────────────────────────────
export default function ResultScreen() {
  const params = useLocalSearchParams();
  const addToCollection = useAppStore((state) => state.addToCollection);
  const removeFromCollection = useAppStore((state) => state.removeFromCollection);
  const updateCollectionItem = useAppStore((state) => state.updateCollectionItem);
  const hasTriggeredReview = useAppStore((state) => state.hasTriggeredReview);
  const collection = useAppStore((state) => state.collection);

  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [fullscreenUri, setFullscreenUri] = useState<string | null>(null);
  const [pendingSave, setPendingSave] = useState(false);
  const [showSetPicker, setShowSetPicker] = useState(false);

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

  // Build image array: user photos first, then Discogs images (deduplicated)
  const userImages: string[] = item.images?.length
    ? item.images
    : item.imageUri
      ? [item.imageUri]
      : [];
  const discogsFullImages: string[] = (item.discogsImages ?? [])
    .map((img) => img.uri)
    .filter((uri) => uri && !userImages.includes(uri));
  const imageList: string[] = [...userImages, ...discogsFullImages];

  // Prune dead local images (e.g. after cache clear) on mount
  useEffect(() => {
    if (!isInCollection) return;
    const localUris = userImages.filter((uri) => uri.startsWith('file://'));
    if (localUris.length === 0) return;

    const dead = localUris.filter((uri) => {
      try { return !new File(uri).exists; } catch { return true; }
    });
    if (dead.length === 0) return;

    const deadSet = new Set(dead);
    const cleanedImages = (item.images ?? []).filter((uri) => !deadSet.has(uri));
    const cleanedUri = deadSet.has(item.imageUri ?? '') ? cleanedImages[0] ?? undefined : item.imageUri;
    updateCollectionItem(item.id, { images: cleanedImages, imageUri: cleanedUri });
  }, [item.id]); // eslint-disable-line react-hooks/exhaustive-deps

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
    showSuccessToast('Added to collection');

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
            navigateBack();
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

  const navigateBack = useCallback(() => {
    const source = params.source as string | undefined;
    if (source?.startsWith('portfolio-')) {
      const tab = source.replace('portfolio-', '');
      router.navigate({ pathname: '/(tabs)/portfolio', params: { tab } });
    } else if (source?.startsWith('setdetail:')) {
      const sid = source.replace('setdetail:', '');
      router.navigate({ pathname: '/(tabs)/(scanner)/setdetail', params: { setId: sid } });
    } else {
      // From scan flow (loading used router.replace), go home instead of back to camera
      router.navigate('/(tabs)/(home)');
    }
  }, [params.source]);

  const handleBack = () => {
    triggerButtonPress();
    if (pendingSave) {
      removeFromCollection(item.id);
    }
    navigateBack();
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
    const options: { text: string; onPress?: () => void; style?: 'destructive' | 'cancel' }[] = [];

    if (isInCollection && !pendingSave) {
      options.push({ text: 'Add to Set', onPress: () => setShowSetPicker(true) });
      options.push({ text: 'Edit', onPress: handleEdit });
      options.push({ text: item.barcode ? 'Update Barcode' : 'Add Barcode', onPress: handleAddBarcode });
      options.push({ text: 'Add / Replace Photos', onPress: handleManagePhotos });
      options.push({ text: 'Re-analyze', onPress: handleReanalyze });
    }

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
                  navigateBack();
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

  // ── Add / Scan Barcode ──
  const handleAddBarcode = () => {
    triggerButtonPress();
    Alert.alert('Add Barcode', undefined, [
      {
        text: 'Enter Manually',
        onPress: () => {
          Alert.prompt(
            'Enter Barcode',
            'Type the barcode number (EAN/UPC)',
            async (text) => {
              const trimmed = text?.trim();
              if (!trimmed || trimmed.length < 8) {
                if (trimmed) Alert.alert('Invalid Barcode', 'Barcode must be at least 8 digits.');
                return;
              }
              updateCollectionItem(item.id, { barcode: trimmed });
              // Try Discogs lookup
              const discogs = await searchByBarcode(trimmed);
              if (discogs) {
                updateCollectionItem(item.id, buildDiscogsUpdates(discogs));
                Alert.alert('Barcode Added', 'Discogs data enriched successfully.');
              } else {
                Alert.alert('Barcode Saved', 'No Discogs match found for this barcode.');
              }
            },
            'plain-text',
            item.barcode ?? '',
            'number-pad',
          );
        },
      },
      {
        text: 'Scan from Photo',
        onPress: async () => {
          const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
          if (!perm.granted) {
            Alert.alert('Permission Required', 'Please grant photo library access.');
            return;
          }
          const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: false,
            quality: 0.8,
          });
          if (result.canceled) return;
          try {
            const barcodes = await scanFromURLAsync(result.assets[0].uri, ['ean13', 'ean8', 'upc_a', 'upc_e']);
            if (barcodes.length > 0) {
              const code = barcodes[0].data;
              updateCollectionItem(item.id, { barcode: code });
              const discogs = await searchByBarcode(code);
              if (discogs) {
                updateCollectionItem(item.id, buildDiscogsUpdates(discogs));
                Alert.alert('Barcode Found', `${code} — Discogs data enriched.`);
              } else {
                Alert.alert('Barcode Found', `${code} saved. No Discogs match found.`);
              }
            } else {
              Alert.alert('No Barcode Found', 'Could not detect a barcode in the selected image.');
            }
          } catch {
            Alert.alert('Scan Failed', 'Unable to scan barcode from image.');
          }
        },
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  // ── Add / Replace Photos ──
  const handleManagePhotos = async () => {
    triggerButtonPress();
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permission Required', 'Please grant photo library access.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      selectionLimit: 3,
      quality: 0.8,
    });
    if (result.canceled || result.assets.length === 0) return;

    const newUris = result.assets.map((a) => a.uri);
    const existingImages = item.images?.length ? item.images : item.imageUri ? [item.imageUri] : [];

    if (existingImages.length > 0) {
      Alert.alert(
        'Photos',
        `You have ${existingImages.length} existing photo${existingImages.length > 1 ? 's' : ''}. What would you like to do?`,
        [
          {
            text: 'Replace All',
            onPress: () => {
              updateCollectionItem(item.id, { images: newUris, imageUri: newUris[0] });
            },
          },
          {
            text: 'Add to Existing',
            onPress: () => {
              const merged = [...existingImages, ...newUris];
              updateCollectionItem(item.id, { images: merged, imageUri: merged[0] });
            },
          },
          { text: 'Cancel', style: 'cancel' },
        ],
      );
    } else {
      updateCollectionItem(item.id, { images: newUris, imageUri: newUris[0] });
    }
  };

  // ── Re-analyze with LLM ──
  const handleReanalyze = () => {
    triggerButtonPress();
    router.push({
      pathname: '/(tabs)/(scanner)/loading',
      params: {
        reanalyzeItemId: item.id,
        source: (params.source as string) ?? '',
      },
    });
  };

  const currentSetIds = storeItem?.setIds ?? paramResult.setIds ?? [];

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
          <TouchableOpacity style={styles.headerButton} onPress={handleBack} activeOpacity={0.7} accessibilityLabel="Go back" accessibilityRole="button">
            <Ionicons name="chevron-back" size={24} color={colors.white} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerButton} onPress={handleHeaderKebab} activeOpacity={0.7} accessibilityLabel="More options" accessibilityRole="button">
            <Ionicons name="ellipsis-vertical" size={20} color={colors.white} />
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Hero Image Carousel (hidden when no images) ── */}
        {imageList.length > 0 && (
          <>
            <View style={styles.heroSection}>
              <LinearGradient
                colors={[colors.accentSurface, 'transparent']}
                style={styles.heroGradient}
                pointerEvents="none"
              />

              <ScrollView
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onMomentumScrollEnd={onImageScroll}
                style={styles.carousel}
              >
                {imageList.map((uri, i) => (
                  <TouchableOpacity
                    key={`img-${i}`}
                    style={styles.carouselItem}
                    onPress={() => setFullscreenUri(uri)}
                    activeOpacity={0.9}
                  >
                    <Image source={{ uri }} style={styles.carouselImage} contentFit="contain" />
                  </TouchableOpacity>
                ))}
              </ScrollView>

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
          </>
        )}

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
            {item.barcode && (
              <View style={styles.chip}>
                <Ionicons name="barcode" size={12} color={colors.iconMuted} />
                <Text style={styles.chipText}>{item.barcode}</Text>
              </View>
            )}
            {item.styles?.map((style, i) => (
              <View key={`style-${i}`} style={styles.chip}>
                <Ionicons name="pricetag" size={12} color={colors.iconMuted} />
                <Text style={styles.chipText}>{style}</Text>
              </View>
            ))}
          </View>

          {/* Key-value rows: Weight, Date */}
          {(item.weight || collectionDateStr) && (
            <View style={styles.detailRows}>
              {item.weight && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailRowLabel}>Weight</Text>
                  <Text style={styles.detailRowValue}>{item.weight}</Text>
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

        {/* ── Vibe Pairing ── */}
        {item.vibePairing && (
          <View style={styles.vibePairingSection}>
            <View style={styles.vibePairingCard}>
              <Ionicons name="headset" size={18} color={colors.accentPrimary} />
              <Text style={styles.vibePairingText}>{item.vibePairing}</Text>
            </View>
          </View>
        )}

        {/* ── Food & Drink Pairing ── */}
        {(item.foodPairing || item.drinkPairing) && (
          <View style={styles.pairingSection}>
            {item.foodPairing && (
              <View style={styles.pairingRow}>
                <View style={styles.pairingIconBox}>
                  <Ionicons name="restaurant" size={16} color={colors.accentPrimary} />
                </View>
                <View style={styles.pairingContent}>
                  <Text style={styles.pairingLabel}>Food</Text>
                  <Text style={styles.pairingValue}>{item.foodPairing}</Text>
                </View>
              </View>
            )}
            {item.drinkPairing && (
              <View style={styles.pairingRow}>
                <View style={styles.pairingIconBox}>
                  <Ionicons name="wine" size={16} color={colors.accentPrimary} />
                </View>
                <View style={styles.pairingContent}>
                  <Text style={styles.pairingLabel}>Drink</Text>
                  <Text style={styles.pairingValue}>{item.drinkPairing}</Text>
                </View>
              </View>
            )}
          </View>
        )}

        {/* ── Description ── */}
        <View style={styles.descriptionSection}>
          <Text style={styles.descriptionText}>{item.description}</Text>
        </View>

        {/* ── Tracklist (Discogs) ── */}
        {item.discogsTracklist && item.discogsTracklist.length > 0 && (
          <View style={styles.detailsSection}>
            <TracklistAccordion tracks={item.discogsTracklist} />
          </View>
        )}

        {/* ── Extra Artists / Credits (Discogs) ── */}
        {item.extraArtists && item.extraArtists.length > 0 && (
          <View style={styles.detailsSection}>
            <ExtraArtistsAccordion artists={item.extraArtists} />
          </View>
        )}

        {/* ── Companies (Discogs) ── */}
        {item.companies && item.companies.length > 0 && (
          <View style={styles.detailsSection}>
            <CompaniesAccordion companies={item.companies} />
          </View>
        )}

        {/* ── Marketplace (Discogs) ── */}
        {(item.lowestPrice != null ||
          item.numForSale != null ||
          item.communityHave != null ||
          item.communityWant != null) && (
          <View style={styles.detailsSection}>
            <MarketplaceInfo
              lowestPrice={item.lowestPrice}
              numForSale={item.numForSale}
              communityHave={item.communityHave}
              communityWant={item.communityWant}
              discogsUrl={item.discogsUrl}
            />
          </View>
        )}

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
              <TouchableOpacity style={styles.iconButton} onPress={handleScanNew} activeOpacity={0.7} accessibilityLabel="Scan new record" accessibilityRole="button">
                <Ionicons name="camera" size={22} color={colors.white} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.iconButton} onPress={handleShare} activeOpacity={0.7} accessibilityLabel="Share" accessibilityRole="button">
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
                  accessibilityLabel="Remove from collection"
                  accessibilityRole="button"
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

      {/* ── Fullscreen Image Viewer ── */}
      <FullscreenViewer
        visible={!!fullscreenUri}
        uri={fullscreenUri ?? ''}
        onClose={() => setFullscreenUri(null)}
      />

      {/* Set Picker Modal */}
      <SetPickerModal
        visible={showSetPicker}
        selectedSetIds={currentSetIds}
        onDone={(ids) => {
          updateCollectionItem(item.id, { setIds: ids });
          setShowSetPicker(false);
        }}
        onClose={() => setShowSetPicker(false)}
      />
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
    paddingHorizontal: spacing.md,
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
    paddingHorizontal: spacing.md,
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

  // ── Vibe Pairing ──
  vibePairingSection: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.lg,
  },
  vibePairingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.accentSurface,
    borderWidth: 1,
    borderColor: colors.accentBorder,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: spacing.md,
  },
  vibePairingText: {
    flex: 1,
    fontSize: 14,
    fontStyle: 'italic',
    fontWeight: '500',
    color: colors.accentPrimary,
    lineHeight: 20,
  },

  // ── Food & Drink Pairing ──
  pairingSection: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    gap: spacing.sm,
  },
  pairingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: spacing.md,
  },
  pairingIconBox: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: colors.accentHighlight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pairingContent: {
    flex: 1,
  },
  pairingLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  pairingValue: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textPrimary,
    lineHeight: 20,
  },

  // ── Description ──
  descriptionSection: {
    paddingHorizontal: spacing.md,
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
    paddingHorizontal: spacing.md,
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
    paddingHorizontal: spacing.md,
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
