import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { LoadingStepItem } from '@/components/LoadingStepItem';
import { appConfig } from '@/config/appConfig';
import { colors, typography, spacing, borderRadius } from '@/theme';
import { triggerPriceReveal } from '@/utils/haptics';
import { getRandomMockResult } from '@/mock/analysisData';
import { analyzeImages } from '@/services/geminiVision';
import { searchByBarcode, searchByQuery } from '@/services/discogs';
import type { DiscogsResult } from '@/services/discogs';
import { buildDiscogsUpdates } from '@/utils/mergeDiscogs';

/** Merge Discogs enrichment fields into an AnalysisResult (used for mock/fallback paths) */
function mergeDiscogsData(result: AnalysisResult, discogs: DiscogsResult | null): void {
  if (!discogs) return;
  if (discogs.thumbnail) result.discogsThumbnail = discogs.thumbnail;
  if (discogs.primaryImage) result.discogsImage = discogs.primaryImage;
  if (discogs.discogsImages.length > 0) result.discogsImages = discogs.discogsImages;
  if (discogs.styles.length > 0) result.styles = discogs.styles;
  if (discogs.weight) result.weight = discogs.weight;
  if (discogs.tracklist.length > 0) result.discogsTracklist = discogs.tracklist;
  if (discogs.companies.length > 0) result.companies = discogs.companies;
  if (discogs.extraArtists.length > 0) result.extraArtists = discogs.extraArtists;
  if (discogs.discogsUrl) result.discogsUrl = discogs.discogsUrl;
  if (discogs.discogsId) result.discogsId = discogs.discogsId;
  if (discogs.lowestPrice != null) result.lowestPrice = discogs.lowestPrice;
  if (discogs.numForSale != null) result.numForSale = discogs.numForSale;
  if (discogs.community) {
    result.communityHave = discogs.community.have;
    result.communityWant = discogs.community.want;
  }
}
import { useAppStore } from '@/store/useAppStore';
import { useScanCart } from '@/context/ScanCartContext';
import { AnalysisResult, CapturedImage } from '@/types';

type StepStatus = 'pending' | 'active' | 'complete';

const THUMB_SIZE = 40;

export default function LoadingScreen() {
  const params = useLocalSearchParams<{
    imageUri?: string;
    cartImages?: string;
    barcode?: string;
    reanalyzeItemId?: string;
    source?: string;
  }>();
  const incrementScanCount = useAppStore((state) => state.incrementScanCount);
  const updateCollectionItem = useAppStore((state) => state.updateCollectionItem);
  const collection = useAppStore((state) => state.collection);
  const { resetCart } = useScanCart();

  const isReanalyze = !!params.reanalyzeItemId;
  const reanalyzeItem = isReanalyze
    ? collection.find((i) => i.id === params.reanalyzeItemId) ?? null
    : null;

  // Parse cart images or fall back to legacy single imageUri.
  // For re-analyze mode, build cart from the existing item's stored images.
  // Memoized so the reference stays stable across re-renders.
  const parsedCart: CapturedImage[] = useMemo(() => {
    if (isReanalyze && reanalyzeItem) {
      const imgs = reanalyzeItem.images?.length
        ? reanalyzeItem.images
        : reanalyzeItem.imageUri
          ? [reanalyzeItem.imageUri]
          : [];
      return imgs.map((uri, i) => ({
        type: (i === 0 ? 'front' : i === 1 ? 'back' : 'label') as CapturedImage['type'],
        uri,
      }));
    }
    if (params.cartImages) {
      try {
        return JSON.parse(params.cartImages);
      } catch {
        if (params.imageUri) {
          return [{ type: 'front' as const, uri: params.imageUri }];
        }
        return [];
      }
    }
    if (params.imageUri) {
      return [{ type: 'front' as const, uri: params.imageUri }];
    }
    return [];
  }, [params.cartImages, params.imageUri, isReanalyze, reanalyzeItem]);

  const imageUri = parsedCart[0]?.uri || params.imageUri || '';
  const effectiveBarcode = params.barcode || reanalyzeItem?.barcode || undefined;

  const steps = appConfig.loadingSteps;
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [apiDone, setApiDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const apiResultRef = useRef<AnalysisResult | null>(null);
  const navigatedRef = useRef(false);
  const stepTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Progress bar animation
  const progressWidth = useSharedValue(0);

  const progressStyle = useAnimatedStyle(() => ({
    width: `${progressWidth.value}%`,
  }));

  // Increment scan count on mount (skip for re-analyze)
  useEffect(() => {
    if (!isReanalyze) incrementScanCount();
  }, [incrementScanCount, isReanalyze]);

  const goToResult = useCallback((result: AnalysisResult) => {
    // Cancel any running step timer so it can't regress the progress bar
    if (stepTimerRef.current) {
      clearTimeout(stepTimerRef.current);
      stepTimerRef.current = null;
    }
    // Fill progress to 100%
    progressWidth.value = withTiming(100, { duration: 300, easing: Easing.out(Easing.cubic) });
    triggerPriceReveal();

    // Re-analyze mode: update the existing item in store and navigate back
    if (isReanalyze && reanalyzeItem) {
      const updates: Partial<AnalysisResult> = {
        name: result.name,
        origin: result.origin,
        year: result.year,
        estimatedValue: result.estimatedValue,
        estimatedValueLow: result.estimatedValueLow,
        estimatedValueHigh: result.estimatedValueHigh,
        confidence: result.confidence,
        description: result.description,
        label: result.label,
        genre: result.genre,
        rarity: result.rarity,
        condition: result.condition,
        vibePairing: result.vibePairing,
        foodPairing: result.foodPairing,
        drinkPairing: result.drinkPairing,
        albumArtQuery: result.albumArtQuery,
        extendedDetails: result.extendedDetails,
        countryCode: result.countryCode,
      };
      updateCollectionItem(reanalyzeItem.id, updates);

      // Also merge Discogs fields if the new result has them
      if (result.discogsId) {
        updateCollectionItem(reanalyzeItem.id, {
          discogsId: result.discogsId,
          discogsUrl: result.discogsUrl,
          discogsImage: result.discogsImage,
          discogsThumbnail: result.discogsThumbnail,
          discogsImages: result.discogsImages,
          discogsTracklist: result.discogsTracklist,
          styles: result.styles,
          weight: result.weight,
          companies: result.companies,
          extraArtists: result.extraArtists,
          lowestPrice: result.lowestPrice,
          numForSale: result.numForSale,
          communityHave: result.communityHave,
          communityWant: result.communityWant,
        });
      }

      setTimeout(() => {
        // Read updated item from store for the result screen
        const updatedItem = useAppStore.getState().collection.find((i) => i.id === reanalyzeItem.id);
        router.replace({
          pathname: '/(tabs)/(scanner)/result',
          params: {
            resultData: JSON.stringify(updatedItem ?? { ...reanalyzeItem, ...updates }),
            source: params.source ?? '',
          },
        });
      }, 500);
      return;
    }

    // Route to not-found screen if AI couldn't identify the item
    if (result.confidence === 0) {
      setTimeout(() => {
        resetCart();
        router.replace({
          pathname: '/(tabs)/(scanner)/notfound',
          params: { imageUri: result.imageUri ?? '' },
        });
      }, 500);
      return;
    }

    setTimeout(() => {
      resetCart();
      router.replace({
        pathname: '/(tabs)/(scanner)/result',
        params: { resultId: result.id, resultData: JSON.stringify(result) },
      });
    }, 500);
  }, [progressWidth, resetCart, isReanalyze, reanalyzeItem, updateCollectionItem, params.source]);

  const navigateToResult = useCallback((result: AnalysisResult) => {
    if (navigatedRef.current) return;
    navigatedRef.current = true;

    // Skip duplicate check for re-analyze (item already exists)
    if (isReanalyze) {
      goToResult(result);
      return;
    }

    // Check for potential duplicates in collection
    const nameLower = result.name.toLowerCase().trim();
    const duplicate = collection.find((existing) => {
      const existingName = existing.name.toLowerCase().trim();
      const nameMatch = existingName === nameLower
        || existingName.includes(nameLower)
        || nameLower.includes(existingName);
      const originMatch = existing.origin === result.origin;
      const yearMatch = existing.year === result.year;
      return nameMatch && originMatch && yearMatch;
    });

    if (duplicate) {
      Alert.alert(
        'Possible Duplicate',
        `"${duplicate.name}" is already in your collection. Keep this scan?`,
        [
          {
            text: 'Discard',
            style: 'destructive',
            onPress: () => {
              resetCart();
              router.back();
            },
          },
          {
            text: 'Continue',
            onPress: () => goToResult(result),
          },
        ],
        { cancelable: false }
      );
      return;
    }

    goToResult(result);
  }, [collection, goToResult, resetCart]);

  useEffect(() => {
    if (error) return;

    const stepDuration = 1200;
    const totalSteps = steps.length;
    // Reserve the last ~15% of the bar for when the API actually finishes
    const maxProgressBeforeApi = 85;
    let stepIdx = 0;

    const advanceStep = () => {
      stepIdx++;

      if (stepIdx >= totalSteps) {
        // All steps visited — signal completion so navigation guard passes.
        stepTimerRef.current = null;
        setCurrentStepIndex(totalSteps);
        return;
      }

      setCurrentStepIndex(stepIdx);
      // Animate progress proportionally, capped at maxProgressBeforeApi
      const stepProgress = ((stepIdx + 1) / totalSteps) * maxProgressBeforeApi;
      progressWidth.value = withTiming(stepProgress, {
        duration: stepDuration * 0.8,
        easing: Easing.out(Easing.cubic),
      });
      stepTimerRef.current = setTimeout(advanceStep, stepDuration);
    };

    // Kick off first progress bump
    progressWidth.value = withTiming((1 / totalSteps) * maxProgressBeforeApi, {
      duration: stepDuration * 0.8,
      easing: Easing.out(Easing.cubic),
    });
    stepTimerRef.current = setTimeout(advanceStep, stepDuration);

    // API call
    const runAnalysis = async () => {
      try {
        let result: AnalysisResult;

        // Look up Discogs metadata by barcode or name query
        let discogsData: DiscogsResult | null = null;

        if (effectiveBarcode) {
          console.log('[Loading] Searching Discogs by barcode:', effectiveBarcode);
          try {
            discogsData = await searchByBarcode(effectiveBarcode);
          } catch (discogsErr) {
            console.log('[Loading] Discogs barcode lookup THREW:', discogsErr);
          }
        }

        // For re-analyze, also try name-based search as fallback
        if (!discogsData && isReanalyze && reanalyzeItem?.name) {
          const query = reanalyzeItem.name
            .replace(/\s*[—–-]\s*/g, ' ')
            .replace(/\([^)]*\)/g, '')
            .trim();
          if (query.length >= 3) {
            try {
              discogsData = await searchByQuery(query);
            } catch {
              // Ignore query search failures
            }
          }
        }

        if (parsedCart.length > 0) {
          try {
            result = await analyzeImages(parsedCart, discogsData, effectiveBarcode);
          } catch (apiError) {
            const message = apiError instanceof Error ? apiError.message : '';
            if (__DEV__ && message.includes('API key not configured')) {
              result = getRandomMockResult();
              result.imageUri = imageUri;
              result.images = parsedCart.map((img) => img.uri);
              if (effectiveBarcode) result.barcode = effectiveBarcode;
              mergeDiscogsData(result, discogsData);
            } else {
              throw apiError;
            }
          }
        } else if (discogsData) {
          // No images but have Discogs data (from barcode or name search) — send to Gemini
          try {
            result = await analyzeImages([], discogsData, effectiveBarcode);
          } catch (apiError) {
            const message = apiError instanceof Error ? apiError.message : '';
            if (__DEV__ && message.includes('API key not configured')) {
              result = getRandomMockResult();
              if (effectiveBarcode) result.barcode = effectiveBarcode;
              mergeDiscogsData(result, discogsData);
            } else {
              throw apiError;
            }
          }
        } else if (__DEV__) {
          result = getRandomMockResult();
          if (effectiveBarcode) result.barcode = effectiveBarcode;
          mergeDiscogsData(result, discogsData);
        } else {
          throw new Error('No images provided for analysis.');
        }

        // For re-analyze, merge Discogs enrichment into the result
        if (isReanalyze && discogsData) {
          const discogsUpdates = buildDiscogsUpdates(discogsData);
          Object.assign(result, discogsUpdates);
        }

        apiResultRef.current = result;
        setApiDone(true);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'An unexpected error occurred.';
        setError(message);
      }
    };

    runAnalysis();

    return () => {
      if (stepTimerRef.current) clearTimeout(stepTimerRef.current);
    };
  }, [error, imageUri, steps.length, progressWidth, parsedCart, effectiveBarcode, isReanalyze, reanalyzeItem]);

  // When API finishes and the step sequence has completed, navigate to the result
  useEffect(() => {
    if (!apiDone || !apiResultRef.current || currentStepIndex < steps.length) return;
    // Small delay so the user sees the final checkmark pop
    const timer = setTimeout(() => {
      navigateToResult(apiResultRef.current!);
    }, 400);
    return () => clearTimeout(timer);
  }, [apiDone, currentStepIndex, steps.length, navigateToResult]);

  const handleRetry = () => {
    setError(null);
    setCurrentStepIndex(0);
    setApiDone(false);
    apiResultRef.current = null;
    navigatedRef.current = false;
    progressWidth.value = 0;
  };

  const handleGoBack = () => {
    resetCart();
    router.back();
  };

  const handleForceSave = () => {
    // Prefer the front cover as the primary image; fall back to first available
    const primaryImage = parsedCart.find((img) => img.type === 'front') ?? parsedCart[0];
    const skeletonResult: AnalysisResult = {
      id: `manual-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
      name: '',
      origin: 'Unknown',
      year: 'Unknown',
      estimatedValue: 0,
      confidence: 0,
      description: 'Manually saved item.',
      imageUri: primaryImage?.uri,
      images: parsedCart.map((img) => img.uri),
      createdAt: Date.now(),
      ...(params.barcode ? { barcode: params.barcode } : {}),
    };

    resetCart();
    router.replace({
      pathname: '/(tabs)/(scanner)/result',
      params: {
        resultId: skeletonResult.id,
        resultData: JSON.stringify(skeletonResult),
        isManualEntry: 'true',
      },
    });
  };

  const getStepStatus = (index: number): StepStatus => {
    if (index < currentStepIndex) return 'complete';
    if (index === currentStepIndex && currentStepIndex < steps.length) return 'active';
    if (currentStepIndex >= steps.length) return 'complete'; // all done
    return 'pending';
  };

  // Error state
  if (error) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.content}>
          <Ionicons name="alert-circle-outline" size={64} color={colors.error} />
          <Text style={styles.errorTitle}>Analysis Failed</Text>
          <Text style={styles.errorMessage}>{error}</Text>
          <View style={styles.errorActions}>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={handleRetry}
              activeOpacity={0.8}
            >
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.forceSaveButton}
              onPress={handleForceSave}
              activeOpacity={0.8}
            >
              <Ionicons name="create-outline" size={18} color={colors.accentPrimary} />
              <Text style={styles.forceSaveButtonText}>
                {appConfig.result.forceSaveText ?? 'Save Manually'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.backButton}
              onPress={handleGoBack}
              activeOpacity={0.7}
            >
              <Text style={styles.backButtonText}>Go Back</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.content}>
        <Text style={styles.title}>{isReanalyze ? 'Re-analyzing...' : 'Analyzing...'}</Text>

        {/* Thumbnail strip during loading */}
        {parsedCart.length > 1 && (
          <View style={styles.thumbnailStrip}>
            {parsedCart.map((img, i) => (
              <View key={`${img.type}-${i}`} style={styles.thumbnailItem}>
                <Image
                  source={{ uri: img.uri }}
                  style={styles.thumbnail}
                  contentFit="cover"
                />
                <Text style={styles.thumbnailLabel}>
                  {img.type.charAt(0).toUpperCase() + img.type.slice(1)}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Progress bar */}
        <View style={styles.progressTrack}>
          <Animated.View style={[styles.progressFill, progressStyle]} />
        </View>

        <View style={styles.steps}>
          {steps.map((step, index) => (
            <LoadingStepItem
              key={index}
              text={step}
              status={getStepStatus(index)}
            />
          ))}
        </View>

        <Text style={styles.subtitle}>
          This may take a few moments as we search our extensive database
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  title: {
    ...typography.h1,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  thumbnailStrip: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  thumbnailItem: {
    alignItems: 'center',
    gap: 4,
  },
  thumbnail: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.border,
  },
  thumbnailLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  progressTrack: {
    width: '100%',
    height: 4,
    backgroundColor: colors.surfaceSubtle,
    borderRadius: 2,
    marginBottom: spacing.xl,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.accentPrimary,
    borderRadius: 2,
  },
  steps: {
    marginBottom: spacing.xl,
    width: '100%',
  },
  subtitle: {
    ...typography.caption,
    textAlign: 'center',
    color: colors.textSecondary,
  },
  errorTitle: {
    ...typography.h2,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  errorMessage: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
    lineHeight: 24,
  },
  errorActions: {
    width: '100%',
  },
  retryButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md + spacing.xs,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  retryButtonText: {
    ...typography.h3,
    color: colors.white,
  },
  forceSaveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md + spacing.xs,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.accentPrimary,
    marginBottom: spacing.md,
  },
  forceSaveButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.accentPrimary,
  },
  backButton: {
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  backButtonText: {
    ...typography.body,
    color: colors.textSecondary,
  },
});
