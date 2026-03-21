import { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert, Modal, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { CollectionHeader } from '@/components/CollectionHeader';
import { CollectionCard } from '@/components/CollectionCard';
import { SpotlightCarousel } from '@/components/SpotlightCarousel';
import { WorldMapPreview } from '@/components/WorldMapPreview';
import { PillTabSwitcher } from '@/components/PillTabSwitcher';
import { GoldenGlow } from '@/components/GoldenGlow';
import { useAppStore } from '@/store/useAppStore';
import { appConfig } from '@/config/appConfig';
import { AnalysisResult } from '@/types';
import { colors, typography, spacing, borderRadius } from '@/theme';
import { triggerButtonPress } from '@/utils/haptics';
import { exportCollectionToPDF } from '@/utils/pdf';

export default function PortfolioScreen() {
  const collection = useAppStore((state) => state.collection);
  const getTotalPortfolioValue = useAppStore((state) => state.getTotalPortfolioValue);
  const getUniqueOrigins = useAppStore((state) => state.getUniqueOrigins);
  const getBestItem = useAppStore((state) => state.getBestItem);
  const getMostAncientItem = useAppStore((state) => state.getMostAncientItem);
  const getRarestItem = useAppStore((state) => state.getRarestItem);
  const getOriginDistribution = useAppStore((state) => state.getOriginDistribution);
  const removeFromCollection = useAppStore((state) => state.removeFromCollection);
  const [isExporting, setIsExporting] = useState(false);
  const [activeTab, setActiveTab] = useState(appConfig.collection.tabs[0].key);
  const [sortBy, setSortBy] = useState('Highest Value');
  const [showSortMenu, setShowSortMenu] = useState(false);

  const totalValue = getTotalPortfolioValue();
  const originCount = getUniqueOrigins();
  const bestItem = getBestItem();
  const mostAncientItem = getMostAncientItem();
  const rarestItem = getRarestItem();
  const originDistribution = getOriginDistribution();
  const spotlightLabels = appConfig.collection.spotlightLabels;

  const handleExportCollection = async () => {
    triggerButtonPress();
    setIsExporting(true);
    try {
      await exportCollectionToPDF(collection);
    } catch {
      Alert.alert('Export Failed', 'Unable to export collection. Please try again.', [{ text: 'OK' }]);
    } finally {
      setIsExporting(false);
    }
  };

  const handleItemPress = (item: AnalysisResult) => {
    router.push({
      pathname: '/(tabs)/(scanner)/result',
      params: { resultData: JSON.stringify(item) },
    });
  };

  const getSortedCollection = () => {
    const sorted = [...collection];
    switch (sortBy) {
      case 'Highest Value':
        return sorted.sort((a, b) => b.estimatedValue - a.estimatedValue);
      case 'Lowest Value':
        return sorted.sort((a, b) => a.estimatedValue - b.estimatedValue);
      case 'Newest':
        return sorted.sort((a, b) => b.createdAt - a.createdAt);
      case 'Oldest':
        return sorted.sort((a, b) => a.createdAt - b.createdAt);
      case 'A-Z':
        return sorted.sort((a, b) => a.name.localeCompare(b.name));
      default:
        return sorted;
    }
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="albums-outline" size={64} color={colors.border} />
      <Text style={styles.emptyText}>{appConfig.collection.emptyStateText}</Text>
      <Text style={styles.emptySubtext}>{appConfig.collection.emptyStateSubtext}</Text>
    </View>
  );

  const renderSummaryTab = () => (
    <View style={styles.summaryContainer}>
      {/* Spotlight Carousel */}
      <SpotlightCarousel
        items={[
          { label: spotlightLabels?.mostValuable ?? 'Most Valuable', item: bestItem },
          { label: spotlightLabels?.mostAncient ?? 'Most Ancient', item: mostAncientItem },
          { label: spotlightLabels?.rarest ?? 'Rarest', item: rarestItem },
        ]}
        onItemPress={handleItemPress}
      />

      {/* Geographic Distribution */}
      {appConfig.collection.showGeographicInsights && originDistribution.length > 0 && (
        <WorldMapPreview
          origins={originDistribution}
          totalItems={collection.length}
          onViewAll={() => {
            router.push({
              pathname: '/map',
              params: {
                origins: JSON.stringify(originDistribution),
                totalItems: String(collection.length),
              },
            });
          }}
        />
      )}

      {/* Export Button */}
      {collection.length > 0 && (
        <TouchableOpacity
          style={[styles.exportButton, isExporting && styles.exportButtonDisabled]}
          onPress={handleExportCollection}
          disabled={isExporting}
          activeOpacity={0.7}
        >
          {isExporting ? (
            <ActivityIndicator color={colors.accentPrimary} />
          ) : (
            <>
              <Ionicons name="download-outline" size={20} color={colors.accentPrimary} style={{ marginRight: spacing.sm }} />
              <Text style={styles.exportButtonText}>{appConfig.collection.exportCollectionText}</Text>
            </>
          )}
        </TouchableOpacity>
      )}
    </View>
  );

  const renderAllTab = () => (
    <View style={styles.allContainer}>
      {/* Sort/Filter Row */}
      {appConfig.collection.sortOptions && (
        <View style={styles.sortRow}>
          <TouchableOpacity
            style={styles.sortButton}
            activeOpacity={0.7}
            onPress={() => setShowSortMenu(true)}
          >
            <Ionicons name="funnel-outline" size={16} color={colors.textSecondary} />
            <Text style={styles.sortText}>{sortBy}</Text>
            <Ionicons name="chevron-down" size={14} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  const renderSetsTab = () => (
    <View style={styles.setsContainer}>
      <Ionicons name="grid-outline" size={48} color={colors.border} />
      <Text style={styles.setsPlaceholder}>Sets coming soon</Text>
    </View>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'summary':
        return renderSummaryTab();
      case 'all':
        return renderAllTab();
      case 'sets':
        return renderSetsTab();
      default:
        return renderSummaryTab();
    }
  };

  const handleKebabPress = (item: AnalysisResult) => {
    triggerButtonPress();
    Alert.alert(
      item.name,
      undefined,
      [
        {
          text: 'Edit',
          onPress: () => {
            router.push({
              pathname: '/(tabs)/(scanner)/edit',
              params: { itemData: JSON.stringify(item) },
            });
          },
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'Delete Item',
              `Remove "${item.name}" from your collection?`,
              [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Delete', style: 'destructive', onPress: () => removeFromCollection(item.id) },
              ]
            );
          },
        },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Ambient gold glow */}
      <GoldenGlow intensity={0.15} />

      <FlatList
        data={activeTab === 'all' ? getSortedCollection() : []}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          activeTab === 'all' ? (
            <CollectionCard
              item={item}
              onPress={() => handleItemPress(item)}
              onKebabPress={() => handleKebabPress(item)}
            />
          ) : null
        )}
        ListHeaderComponent={
          <>
            {/* Collection Header with Value — no separate title */}
            {collection.length > 0 && (
              <CollectionHeader
                totalValue={totalValue}
                itemCount={collection.length}
                originCount={originCount}
              />
            )}

            {/* Pill Tab Switcher */}
            {collection.length > 0 && (
              <View style={styles.tabContainer}>
                <PillTabSwitcher
                  tabs={appConfig.collection.tabs}
                  activeTab={activeTab}
                  onTabChange={setActiveTab}
                />
              </View>
            )}

            {/* Tab Content */}
            {collection.length > 0 ? renderTabContent() : renderEmptyState()}
          </>
        }
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />

      {/* Sort dropdown modal */}
      <Modal
        visible={showSortMenu}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSortMenu(false)}
      >
        <Pressable style={styles.sortOverlay} onPress={() => setShowSortMenu(false)}>
          <View style={styles.sortDropdown}>
            <Text style={styles.sortDropdownTitle}>Sort By</Text>
            {(appConfig.collection.sortOptions ?? []).map((option) => (
              <TouchableOpacity
                key={option}
                style={[
                  styles.sortOption,
                  sortBy === option && styles.sortOptionActive,
                ]}
                onPress={() => {
                  setSortBy(option);
                  setShowSortMenu(false);
                }}
                activeOpacity={0.7}
              >
                <Text style={[
                  styles.sortOptionText,
                  sortBy === option && styles.sortOptionTextActive,
                ]}>
                  {option}
                </Text>
                {sortBy === option && (
                  <Ionicons name="checkmark" size={18} color={colors.accentPrimary} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  listContent: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
    flexGrow: 1,
  },
  tabContainer: {
    marginBottom: spacing.md,
  },
  // Summary tab
  summaryContainer: {
    marginBottom: spacing.md,
  },
  // All tab
  allContainer: {
    marginBottom: spacing.sm,
  },
  sortRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: spacing.sm,
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: 6,
    paddingHorizontal: spacing.sm,
    backgroundColor: colors.surfaceSubtle,
    borderRadius: borderRadius.round,
  },
  sortText: {
    ...typography.caption,
    color: colors.textSecondary,
    fontSize: 13,
  },
  // Sort dropdown
  sortOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  sortDropdown: {
    backgroundColor: colors.backgroundSecondary,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.sm,
    overflow: 'hidden',
  },
  sortDropdownTitle: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  sortOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: 14,
  },
  sortOptionActive: {
    backgroundColor: colors.accentSurface,
  },
  sortOptionText: {
    ...typography.body,
    color: colors.textPrimary,
  },
  sortOptionTextActive: {
    color: colors.accentPrimary,
    fontWeight: '600',
  },
  // Sets tab
  setsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl * 2,
  },
  setsPlaceholder: {
    ...typography.body,
    color: colors.textTertiary,
    marginTop: spacing.md,
  },
  // Empty state
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.xxl * 2,
  },
  emptyText: {
    ...typography.h3,
    color: colors.textSecondary,
    marginTop: spacing.lg,
    textAlign: 'center',
  },
  emptySubtext: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  // Export button
  exportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surfaceSubtle,
  },
  exportButtonDisabled: {
    opacity: 0.6,
  },
  exportButtonText: {
    ...typography.body,
    color: colors.accentPrimary,
    fontWeight: '600',
  },
});
