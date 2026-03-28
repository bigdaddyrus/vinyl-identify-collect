import { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Modal, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { HomeHero } from '@/components/HomeHero';
import { GradientButton } from '@/components/GradientButton';
import { ProBadge } from '@/components/ProBadge';
import { GoldenGlow } from '@/components/GoldenGlow';
import { HorizontalCarousel } from '@/components/HorizontalCarousel';
import { useAppStore } from '@/store/useAppStore';
import { appConfig } from '@/config/appConfig';
import { colors, typography, spacing, borderRadius } from '@/theme';
import { exportCollectionAsJSON, exportImageAssetsZip } from '@/utils/exportCollection';

export default function HomeScreen() {
  const { home } = appConfig;
  const collection = useAppStore((state) => state.collection);
  const getTotalPortfolioValue = useAppStore((state) => state.getTotalPortfolioValue);
  const getUniqueOrigins = useAppStore((state) => state.getUniqueOrigins);
  const isEmpty = collection.length === 0;

  const [exporting, setExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState({ current: 0, total: 0 });

  const handleIdentify = () => {
    router.push('/(tabs)/(scanner)');
  };

  const handleGrading = () => {
    router.push('/(tabs)/(scanner)');
  };

  const handleProBadge = () => {
    router.push({ pathname: '/paywall', params: { modal: 'true' } });
  };

  const handleExportData = async () => {
    try {
      await exportCollectionAsJSON(collection);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Export failed.';
      Alert.alert('Export Error', message);
    }
  };

  const handleExportImages = async () => {
    try {
      setExporting(true);
      setExportProgress({ current: 0, total: 0 });
      await exportImageAssetsZip(collection, (current, total) => {
        setExportProgress({ current, total });
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Export failed.';
      Alert.alert('Export Error', message);
    } finally {
      setExporting(false);
    }
  };

  // Shuffle seed changes each time the component mounts (navigated to)
  const [shuffleSeed] = useState(() => Math.random());

  // Shuffle collection items for the stacked display using Fisher-Yates
  const stackImages = useMemo(() => {
    const withImages = collection.filter((item) => item.imageUri);
    const shuffled = [...withImages];
    // Seeded shuffle so it's stable during the same mount
    let seed = shuffleSeed;
    for (let i = shuffled.length - 1; i > 0; i--) {
      seed = (seed * 16807) % 2147483647;
      const j = Math.floor((seed / 2147483647) * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled.slice(0, 3);
  }, [collection, shuffleSeed]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Ambient gold glow */}
        <GoldenGlow intensity={0.15} />

        {/* Top Bar with PRO Badge */}
        <View style={styles.topBar}>
          <Text style={styles.appTitle}>{appConfig.appName}</Text>
          <ProBadge onPress={handleProBadge} />
        </View>

        {/* Hero Section: Empty vs Populated */}
        {isEmpty ? (
          <HomeHero
            title={home.emptyState.title}
            subtitle=""
            image={home.emptyState.image}
            variant="emptyState"
          />
        ) : (
          <View style={styles.collectionSummary}>
            {/* Left: Value + Stats */}
            <View style={styles.summaryLeft}>
              <Text style={styles.summaryValue}>
                {appConfig.result.currencySymbol}
                {getTotalPortfolioValue().toLocaleString()}
              </Text>
              <Text style={styles.summaryLabel}>
                {appConfig.collection.currencyLabel}
              </Text>

              {/* Stats — separate rows */}
              <View style={styles.statsColumn}>
                <View style={styles.statRow}>
                  <Ionicons name="layers-outline" size={16} color={colors.textSecondary} />
                  <Text style={styles.statText}>
                    {collection.length} {collection.length === 1 ? 'Item' : 'Items'}
                  </Text>
                </View>
                <View style={styles.statRow}>
                  <Ionicons name="flag-outline" size={16} color={colors.textSecondary} />
                  <Text style={styles.statText}>
                    {getUniqueOrigins()} {getUniqueOrigins() === 1 ? 'Origin' : 'Origins'}
                  </Text>
                </View>
              </View>
            </View>

            {/* Right: Stacked stamp images — tap to view collection */}
            {stackImages.length > 0 && (
              <TouchableOpacity
                style={styles.stackContainer}
                onPress={() => router.push('/(tabs)/portfolio')}
                activeOpacity={0.8}
              >
                {stackImages.map((item, index) => (
                  <View
                    key={item.id}
                    style={[
                      styles.stackImageWrapper,
                      {
                        transform: [
                          { rotate: `${(index - 1) * 8}deg` },
                          { translateX: index * 6 },
                        ],
                        zIndex: stackImages.length - index,
                      },
                    ]}
                  >
                    <Image
                      source={{ uri: item.imageUri }}
                      style={styles.stackImage}
                      contentFit="cover"
                    />
                  </View>
                ))}
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* CTAs */}
        <View style={styles.ctaContainer}>
          <GradientButton
            text={home.primaryCtaText}
            onPress={handleIdentify}
            icon="camera"
          />
          {home.showGradingButton && (
            <>
              <View style={styles.ctaSpacer} />
              <GradientButton
                text={home.secondaryCtaText}
                onPress={handleGrading}
                variant="secondary"
              />
            </>
          )}
        </View>

        {/* Export Data */}
        {!isEmpty && (
          <View style={styles.exportContainer}>
            <TouchableOpacity style={styles.exportButton} onPress={handleExportData} activeOpacity={0.7}>
              <Ionicons name="download-outline" size={18} color={colors.accentPrimary} />
              <Text style={styles.exportButtonText}>
                {appConfig.collection.exportDataText ?? 'Export Data'}
              </Text>
            </TouchableOpacity>
            <View style={styles.exportSpacer} />
            <TouchableOpacity style={styles.exportImagesButton} onPress={handleExportImages} activeOpacity={0.7}>
              <Ionicons name="images-outline" size={18} color={colors.textSecondary} />
              <Text style={styles.exportImagesButtonText}>Export Images (ZIP)</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Promo Banner */}
        {home.promoBanner?.enabled && (
          <TouchableOpacity style={styles.promoBanner} activeOpacity={0.8}>
            <View style={styles.promoContent}>
              <Text style={styles.promoTitle}>{home.promoBanner.title}</Text>
              {home.promoBanner.subtitle && (
                <Text style={styles.promoSubtitle}>{home.promoBanner.subtitle}</Text>
              )}
            </View>
          </TouchableOpacity>
        )}

        {/* Item of the Day — wide featured card */}
        {home.cards.itemOfDay.enabled && (
          <View style={styles.itemOfDayContainer}>
            <Text style={styles.sectionTitle}>{home.cards.itemOfDay.title}</Text>
            <TouchableOpacity style={styles.itemOfDayCard} activeOpacity={0.8}>
              <View style={styles.itemOfDayImageWrapper}>
                <Image
                  source={home.cards.itemOfDay.image || { uri: `https://picsum.photos/seed/item-of-day/600/340` }}
                  style={styles.itemOfDayImage}
                  contentFit="cover"
                />
                {/* Value badge overlay */}
                {home.cards.itemOfDay.placeholderValue && (
                  <View style={styles.itemOfDayBadge}>
                    <Text style={styles.itemOfDayBadgeText}>
                      {home.cards.itemOfDay.placeholderValue}
                    </Text>
                  </View>
                )}
              </View>
              <View style={styles.itemOfDayInfo}>
                <Text style={styles.itemOfDayName} numberOfLines={2}>
                  {home.cards.itemOfDay.placeholderName || home.cards.itemOfDay.description}
                </Text>
                <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
              </View>
            </TouchableOpacity>
          </View>
        )}

        {/* Expert Picks Carousel */}
        {home.cards.expertPicks.enabled && home.cards.expertPicks.items && (
          <HorizontalCarousel
            title={home.cards.expertPicks.title}
            items={home.cards.expertPicks.items}
          />
        )}

        {/* Educational / Books Carousel */}
        {home.cards.educational.enabled && home.cards.educational.items && (
          <HorizontalCarousel
            title={home.cards.educational.title}
            items={home.cards.educational.items}
          />
        )}
      </ScrollView>

      {/* Export progress overlay */}
      <Modal visible={exporting} transparent animationType="fade">
        <View style={styles.progressOverlay}>
          <View style={styles.progressCard}>
            <ActivityIndicator size="small" color={colors.accentPrimary} />
            <Text style={styles.progressTitle}>Exporting Images...</Text>
            <Text style={styles.progressCount}>
              {exportProgress.current} / {exportProgress.total} images
            </Text>
            <View style={styles.progressBarBg}>
              <View
                style={[
                  styles.progressBarFill,
                  {
                    width: exportProgress.total > 0
                      ? `${(exportProgress.current / exportProgress.total) * 100}%`
                      : '0%',
                  },
                ]}
              />
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    position: 'relative',
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: spacing.xl,
    position: 'relative',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
  },
  appTitle: {
    ...typography.h2,
    color: colors.textPrimary,
    fontWeight: '800',
    letterSpacing: -0.3,
  },

  // ── Collection summary (populated state) ──
  collectionSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
  },
  summaryLeft: {
    flex: 1,
  },
  summaryValue: {
    fontSize: 36,
    fontFamily: 'PlayfairDisplay_700Bold',
    color: colors.textPrimary,
    fontWeight: '700',
  },
  summaryLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginTop: spacing.xs,
  },
  statsColumn: {
    marginTop: spacing.lg,
    gap: spacing.sm,
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  statText: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '600',
  },

  // ── Stacked item images ──
  stackContainer: {
    width: 160,
    height: 180,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stackImageWrapper: {
    position: 'absolute',
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: colors.backgroundSecondary,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 5,
  },
  stackImage: {
    width: 110,
    height: 135,
  },

  // ── CTAs ──
  ctaContainer: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
  },
  ctaSpacer: {
    height: spacing.sm,
  },

  // ── Export ──
  exportContainer: {
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.sm,
  },
  exportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: 12,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceSubtle,
  },
  exportButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.accentPrimary,
  },
  exportSpacer: {
    height: spacing.sm,
  },
  exportImagesButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: 12,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    backgroundColor: colors.backgroundSecondary,
  },
  exportImagesButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },

  // ── Promo banner ──
  promoBanner: {
    marginHorizontal: spacing.xl,
    marginVertical: spacing.md,
    backgroundColor: colors.surfaceSubtle,
    borderRadius: 16,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  promoContent: {
    alignItems: 'center',
  },
  promoTitle: {
    ...typography.h3,
    color: colors.premiumGold,
  },
  promoSubtitle: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },

  // ── Item of the Day — wide featured card ──
  itemOfDayContainer: {
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  itemOfDayCard: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  itemOfDayImageWrapper: {
    width: '100%',
    height: 180,
    position: 'relative',
  },
  itemOfDayImage: {
    width: '100%',
    height: '100%',
  },
  itemOfDayBadge: {
    position: 'absolute',
    bottom: spacing.md,
    left: spacing.md,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: borderRadius.sm,
  },
  itemOfDayBadgeText: {
    fontSize: 16,
    fontFamily: 'PlayfairDisplay_700Bold',
    fontWeight: '700',
    color: colors.white,
  },
  itemOfDayInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  itemOfDayName: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
  },

  // ── Export progress overlay ──
  progressOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressCard: {
    width: '80%',
    backgroundColor: colors.backgroundSecondary,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    alignItems: 'center',
    gap: spacing.md,
  },
  progressTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  progressCount: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  progressBarBg: {
    width: '100%',
    height: 6,
    backgroundColor: colors.backgroundTertiary,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: colors.accentPrimary,
    borderRadius: 3,
  },
});
