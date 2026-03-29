import { useRef, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import * as Sharing from 'expo-sharing';
import { Ionicons } from '@expo/vector-icons';
import { getColors } from 'react-native-image-colors';
import ViewShot from 'react-native-view-shot';
import { LinearGradient } from 'expo-linear-gradient';
import { GradientButton } from '@/components/GradientButton';
import { appConfig } from '@/config/appConfig';
import { AnalysisResult } from '@/types';
import { colors, spacing } from '@/theme';
import { triggerButtonPress, triggerCollectionAdd } from '@/utils/haptics';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH - spacing.xl * 2;
const CARD_IMAGE_SIZE = CARD_WIDTH * 0.38;

/** Lighten a hex color towards white by a fraction (0 = unchanged, 1 = white). */
function lightenHex(hex: string, amount: number): string {
  const r = Math.round(parseInt(hex.slice(1, 3), 16) + (255 - parseInt(hex.slice(1, 3), 16)) * amount);
  const g = Math.round(parseInt(hex.slice(3, 5), 16) + (255 - parseInt(hex.slice(3, 5), 16)) * amount);
  const b = Math.round(parseInt(hex.slice(5, 7), 16) + (255 - parseInt(hex.slice(5, 7), 16)) * amount);
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

/** Check whether a color string is a valid hex color. */
function isHex(c: string | undefined): c is string {
  return !!c && /^#[0-9a-fA-F]{6}$/.test(c);
}

export default function ShareScreen() {
  const params = useLocalSearchParams();
  const viewShotRef = useRef<ViewShot>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [bgColors, setBgColors] = useState<[string, string]>(['#FFFFFF', '#F0F0F0']);

  let item: AnalysisResult | null = null;
  const rawItemData = params.itemData;
  if (typeof rawItemData === 'string') {
    try {
      item = JSON.parse(rawItemData) as AnalysisResult;
    } catch {
      item = null;
    }
  }

  // Build image array
  const imageList: string[] = item?.images?.length
    ? item.images
    : item?.imageUri
      ? [item.imageUri]
      : [];

  const frontImage = imageList[0] ?? null;
  const backImage = imageList[1] ?? null;

  // Extract dominant colors from the first image
  useEffect(() => {
    if (!frontImage) return;

    getColors(frontImage, {
      fallback: '#FFFFFF',
      cache: true,
      key: frontImage,
    }).then((result) => {
      let dominant: string | undefined;
      let secondary: string | undefined;

      if (result.platform === 'android') {
        dominant = result.dominant;
        secondary = result.muted;
      } else if (result.platform === 'ios') {
        dominant = result.background;
        secondary = result.secondary;
      } else {
        dominant = result.dominant;
        secondary = result.muted;
      }

      const d = isHex(dominant) ? dominant : '#FFFFFF';
      const s = isHex(secondary) ? secondary : d;
      // Use lightened versions so text remains readable
      setBgColors([lightenHex(d, 0.55), lightenHex(s, 0.65)]);
    }).catch(() => {
      // keep defaults
    });
  }, [frontImage]);

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

  const hasImages = frontImage || backImage;

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
          <LinearGradient
            colors={bgColors}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.card}
          >
            {/* Item images — square frames */}
            {hasImages && (
              <View style={styles.cardImageRow}>
                {frontImage && (
                  <View style={styles.cardImageColumn}>
                    <View style={styles.cardImageWrapper}>
                      <Image source={{ uri: frontImage }} style={styles.cardImage} contentFit="cover" />
                    </View>
                    <Text style={styles.cardImageLabel}>Front</Text>
                  </View>
                )}
                {backImage && (
                  <View style={styles.cardImageColumn}>
                    <View style={styles.cardImageWrapper}>
                      <Image source={{ uri: backImage }} style={styles.cardImage} contentFit="cover" />
                    </View>
                    <Text style={styles.cardImageLabel}>Back</Text>
                  </View>
                )}
              </View>
            )}

            {/* Price */}
            <Text style={styles.cardPrice}>{priceDisplay()}</Text>

            {/* Name and year */}
            <Text style={styles.cardName}>
              {item.name} {item.year ? `\u00B7 ${item.year}` : ''}
            </Text>

            {/* Genre tag */}
            {item.genre && (
              <Text style={styles.cardGenre}>{item.genre}</Text>
            )}

            {/* Branding */}
            <View style={styles.cardBranding}>
              <Text style={styles.cardBrandingText}>{appConfig.appName}</Text>
            </View>
          </LinearGradient>
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
    borderRadius: 16,
    paddingBottom: spacing.lg,
    overflow: 'hidden',
  },
  cardImageRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-start',
    gap: spacing.md,
    paddingTop: spacing.xl,
    paddingBottom: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  cardImageColumn: {
    alignItems: 'center',
    gap: 6,
  },
  cardImageWrapper: {
    width: CARD_IMAGE_SIZE,
    height: CARD_IMAGE_SIZE,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.4)',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  cardImageLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(0,0,0,0.45)',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
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
    fontWeight: '500',
    color: '#444444',
    textAlign: 'center',
    marginTop: spacing.xs,
    paddingHorizontal: spacing.lg,
  },
  cardGenre: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(0,0,0,0.4)',
    textAlign: 'center',
    marginTop: spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  cardBranding: {
    alignItems: 'center',
    marginTop: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(0,0,0,0.12)',
    marginHorizontal: spacing.lg,
  },
  cardBrandingText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(0,0,0,0.35)',
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
