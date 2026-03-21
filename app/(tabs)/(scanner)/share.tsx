import { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import * as Sharing from 'expo-sharing';
import { Ionicons } from '@expo/vector-icons';
import ViewShot from 'react-native-view-shot';
import { GradientButton } from '@/components/GradientButton';
import { appConfig } from '@/config/appConfig';
import { AnalysisResult } from '@/types';
import { colors, spacing } from '@/theme';
import { triggerButtonPress, triggerCollectionAdd } from '@/utils/haptics';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH - spacing.xl * 2;
const CARD_IMAGE_SIZE = CARD_WIDTH * 0.35;

export default function ShareScreen() {
  const params = useLocalSearchParams();
  const viewShotRef = useRef<ViewShot>(null);
  const [isCapturing, setIsCapturing] = useState(false);

  let item: AnalysisResult | null = null;
  const rawItemData = params.itemData;
  if (typeof rawItemData === 'string') {
    try {
      item = JSON.parse(rawItemData) as AnalysisResult;
    } catch {
      item = null;
    }
  }

  if (!item) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.errorText}>Error: No item data found</Text>
      </SafeAreaView>
    );
  }

  const { currencySymbol } = appConfig.result;

  const formatValue = (value: number) => {
    if (value >= 1000000) return `${currencySymbol}${(value / 1000000).toFixed(2)}M`;
    if (value >= 1000) return `${currencySymbol}${(value / 1000).toFixed(1)}K`;
    return `${currencySymbol}${value.toLocaleString()}`;
  };

  const priceDisplay = () => {
    if (item.estimatedValueLow != null && item.estimatedValueHigh != null) {
      return `${formatValue(item.estimatedValueLow)} – ${formatValue(item.estimatedValueHigh)}`;
    }
    return formatValue(item.estimatedValue);
  };

  // Build image array
  const imageList: string[] = item.images?.length
    ? item.images
    : item.imageUri
      ? [item.imageUri]
      : [];

  const handleClose = () => {
    triggerButtonPress();
    router.back();
  };

  const handleDownload = async () => {
    triggerButtonPress();
    if (!viewShotRef.current?.capture) return;

    setIsCapturing(true);
    try {
      const uri = await viewShotRef.current.capture();
      triggerCollectionAdd();

      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        await Sharing.shareAsync(uri, {
          mimeType: 'image/png',
          dialogTitle: item.name,
        });
      }
    } catch {
      // Sharing cancelled or unavailable
    } finally {
      setIsCapturing(false);
    }
  };

  // Condition display label mapping
  const conditionLabels: Record<string, string> = {
    Mint: 'Mint Condition',
    AU: 'Almost Uncirculated',
    VF: 'Very Fine',
    F: 'Fine',
    VG: 'Very Good',
    G: 'Good',
    Fair: 'Fair',
    Poor: 'Poor',
    Uncertain: 'Uncertain',
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <SafeAreaView edges={['top']} style={styles.headerSafe}>
        <View style={styles.headerBar}>
          <Text style={styles.headerTitle}>Share</Text>
          <TouchableOpacity style={styles.closeButton} onPress={handleClose} activeOpacity={0.7}>
            <Ionicons name="close" size={22} color={colors.white} />
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      {/* Card Preview */}
      <View style={styles.cardWrapper}>
        <ViewShot
          ref={viewShotRef}
          options={{ format: 'png', quality: 1 }}
          style={styles.viewShot}
        >
          <View style={styles.card}>
            {/* Item images */}
            <View style={styles.cardImageRow}>
              {imageList.length > 0 ? (
                imageList.slice(0, 2).map((uri, i) => (
                  <View key={`share-img-${i}`} style={styles.cardImageWrapper}>
                    <Image source={{ uri }} style={styles.cardImage} contentFit="cover" />
                  </View>
                ))
              ) : (
                <View style={styles.cardImagePlaceholder}>
                  <Ionicons name="image-outline" size={48} color="#CCC" />
                </View>
              )}
            </View>

            {/* Price */}
            <Text style={styles.cardPrice}>{priceDisplay()}</Text>

            {/* Name and year */}
            <Text style={styles.cardName}>
              {item.name} {item.year ? `\u00B7 ${item.year}` : ''}
            </Text>

            {/* Grade / Condition */}
            {item.condition && (
              <View style={styles.cardGradeRow}>
                <View>
                  <Text style={styles.cardGrade}>{item.condition}</Text>
                  <Text style={styles.cardGradeLabel}>
                    ({conditionLabels[item.condition] ?? item.condition})
                  </Text>
                </View>
              </View>
            )}

            {/* Branding */}
            <View style={styles.cardBranding}>
              <Text style={styles.cardBrandingText}>{appConfig.appName}</Text>
            </View>
          </View>
        </ViewShot>
      </View>

      {/* Download Button */}
      <SafeAreaView edges={['bottom']} style={styles.bottomBar}>
        {isCapturing ? (
          <View style={styles.loadingButton}>
            <ActivityIndicator color={colors.white} />
          </View>
        ) : (
          <GradientButton text="Download" onPress={handleDownload} icon="download-outline" />
        )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  headerSafe: {
    backgroundColor: colors.background,
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surfaceSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    fontSize: 16,
    color: colors.error,
    textAlign: 'center',
    padding: spacing.xl,
    marginTop: spacing.xxl,
  },

  // Card
  cardWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  viewShot: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  card: {
    width: CARD_WIDTH,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingBottom: spacing.lg,
    overflow: 'hidden',
  },
  cardImageRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.md,
    paddingTop: spacing.xl,
    paddingBottom: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  cardImageWrapper: {
    width: CARD_IMAGE_SIZE,
    height: CARD_IMAGE_SIZE,
    borderRadius: CARD_IMAGE_SIZE / 2,
    overflow: 'hidden',
    backgroundColor: '#F0F0F0',
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  cardImagePlaceholder: {
    width: CARD_IMAGE_SIZE,
    height: CARD_IMAGE_SIZE,
    borderRadius: CARD_IMAGE_SIZE / 2,
    backgroundColor: '#F0F0F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardPrice: {
    fontSize: 36,
    fontWeight: '700',
    fontFamily: 'PlayfairDisplay_700Bold',
    color: '#1A1A1A',
    textAlign: 'center',
    paddingHorizontal: spacing.lg,
  },
  cardName: {
    fontSize: 15,
    fontWeight: '400',
    color: '#666666',
    textAlign: 'center',
    marginTop: spacing.xs,
    paddingHorizontal: spacing.lg,
  },
  cardGradeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    marginTop: spacing.lg,
  },
  cardGrade: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  cardGradeLabel: {
    fontSize: 13,
    fontWeight: '400',
    color: '#999999',
    marginTop: 2,
  },
  cardBranding: {
    alignItems: 'center',
    marginTop: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E0E0E0',
    marginHorizontal: spacing.lg,
  },
  cardBrandingText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#AAAAAA',
    letterSpacing: 0.5,
  },

  // Bottom
  bottomBar: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  loadingButton: {
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
