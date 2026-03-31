import { useState, useCallback, useEffect, useLayoutEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert, Modal, Pressable, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { router, useLocalSearchParams, useNavigation } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { CollectionHeader } from '@/components/CollectionHeader';
import { CollectionCard } from '@/components/CollectionCard';
import { SpotlightCarousel } from '@/components/SpotlightCarousel';
import { WorldMapPreview } from '@/components/WorldMapPreview';
import { PillTabSwitcher } from '@/components/PillTabSwitcher';
import { GoldenGlow } from '@/components/GoldenGlow';
import { BulkMoveModal } from '@/components/BulkMoveModal';
import { useAppStore } from '@/store/useAppStore';
import { appConfig } from '@/config/appConfig';
import * as ImagePicker from 'expo-image-picker';
import { scanFromURLAsync } from 'expo-camera';
import { AnalysisResult, CapturedImage, CollectionSet } from '@/types';
import { colors, typography, spacing, borderRadius } from '@/theme';
import { triggerButtonPress } from '@/utils/haptics';
import { exportCollectionToPDF } from '@/utils/pdf';
import { exportCollectionAsJSON, exportImageAssetsZip } from '@/utils/exportCollection';
import { backpopulateDiscogs, BackpopulateProgress } from '@/services/backpopulateDiscogs';
import { searchByBarcode, searchByQuery } from '@/services/discogs';
import { analyzeImages } from '@/services/geminiVision';
import { buildDiscogsUpdates } from '@/utils/mergeDiscogs';

const DEFAULT_TAB_BAR_STYLE = {
  backgroundColor: '#0A0A0A',
  borderTopWidth: 0,
  paddingTop: 8,
  paddingBottom: 8,
  height: 70,
} as const;

export default function PortfolioScreen() {
  const { tab } = useLocalSearchParams<{ tab?: string }>();
  const navigation = useNavigation();
  const collection = useAppStore((state) => state.collection);
  const getTotalPortfolioValue = useAppStore((state) => state.getTotalPortfolioValue);
  const getUniqueOrigins = useAppStore((state) => state.getUniqueOrigins);
  const getBestItem = useAppStore((state) => state.getBestItem);
  const getMostAncientItem = useAppStore((state) => state.getMostAncientItem);
  const getRarestItem = useAppStore((state) => state.getRarestItem);
  const getOriginDistribution = useAppStore((state) => state.getOriginDistribution);
  const removeFromCollection = useAppStore((state) => state.removeFromCollection);
  const updateCollectionItem = useAppStore((state) => state.updateCollectionItem);
  const clearAllData = useAppStore((state) => state.clearAllData);
  const sets = useAppStore((state) => state.sets);
  const createSet = useAppStore((state) => state.createSet);
  const renameSet = useAppStore((state) => state.renameSet);
  const deleteSet = useAppStore((state) => state.deleteSet);
  const getItemsInSet = useAppStore((state) => state.getItemsInSet);
  const getSetValue = useAppStore((state) => state.getSetValue);
  const [isExporting, setIsExporting] = useState(false);
  const [activeTab, setActiveTab] = useState(tab ?? appConfig.collection.tabs[0].key);

  useEffect(() => {
    if (tab) setActiveTab(tab);
  }, [tab]);

  const [sortBy, setSortBy] = useState('Recently Collected');
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [showPageMenu, setShowPageMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateSet, setShowCreateSet] = useState(false);
  const [newSetName, setNewSetName] = useState('');
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showBulkMove, setShowBulkMove] = useState(false);
  const [isBackpopulating, setIsBackpopulating] = useState(false);
  const [backpopProgress, setBackpopProgress] = useState<BackpopulateProgress | null>(null);
  const [reanalyzingId, setReanalyzingId] = useState<string | null>(null);

  useLayoutEffect(() => {
    navigation.getParent()?.setOptions({
      tabBarStyle: isSelecting
        ? { display: 'none' as const }
        : DEFAULT_TAB_BAR_STYLE,
    });
  }, [isSelecting, navigation]);

  const totalValue = getTotalPortfolioValue();
  const originCount = getUniqueOrigins();
  const bestItem = getBestItem();
  const mostAncientItem = getMostAncientItem();
  const rarestItem = getRarestItem();
  const originDistribution = getOriginDistribution();
  const spotlightLabels = appConfig.collection.spotlightLabels;

  const handleDeleteAllData = () => {
    setShowPageMenu(false);
    Alert.alert(
      'Delete All Data',
      'This will permanently delete your entire collection and all stored images. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Everything',
          style: 'destructive',
          onPress: async () => {
            await clearAllData();
          },
        },
      ]
    );
  };

  const handleBackpopulateDiscogs = async () => {
    setShowPageMenu(false);
    const needsEnrichment = collection.filter((item) => !item.discogsId).length;
    if (needsEnrichment === 0) {
      Alert.alert('Up to Date', 'All records already have Discogs data.');
      return;
    }
    Alert.alert(
      'Enrich from Discogs',
      `${needsEnrichment} record${needsEnrichment === 1 ? '' : 's'} missing Discogs data. This will search Discogs for each one. This may take a minute or two.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Start',
          onPress: async () => {
            setIsBackpopulating(true);
            try {
              const result = await backpopulateDiscogs(
                collection,
                updateCollectionItem,
                (progress) => setBackpopProgress(progress),
              );
              setBackpopProgress(null);
              Alert.alert(
                'Enrichment Complete',
                `Enriched: ${result.enriched}\nNot found: ${result.failed}\nAlready had data: ${result.skipped}`,
              );
            } catch {
              Alert.alert('Error', 'Discogs enrichment failed. Please try again.');
            } finally {
              setIsBackpopulating(false);
              setBackpopProgress(null);
            }
          },
        },
      ],
    );
  };

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

  const exitSelectionMode = useCallback(() => {
    setIsSelecting(false);
    setSelectedIds(new Set());
  }, []);

  const toggleSelectItem = useCallback((itemId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(itemId)) {
        next.delete(itemId);
      } else {
        next.add(itemId);
      }
      return next;
    });
  }, []);

  const handleSelectAll = useCallback(() => {
    const sorted = getSortedCollection();
    if (selectedIds.size === sorted.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(sorted.map((i) => i.id)));
    }
  }, [selectedIds.size, collection, sortBy, searchQuery]);

  const handleBulkDelete = () => {
    if (selectedIds.size === 0) return;
    triggerButtonPress();
    Alert.alert(
      'Delete Items',
      `Remove ${selectedIds.size} ${selectedIds.size === 1 ? 'record' : 'records'} from your collection?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            for (const id of selectedIds) {
              removeFromCollection(id);
            }
            exitSelectionMode();
          },
        },
      ]
    );
  };

  const runBulkExport = async (exportFn: (items: AnalysisResult[]) => Promise<void | string>) => {
    setIsExporting(true);
    try {
      const items = collection.filter((i) => selectedIds.has(i.id));
      await exportFn(items);
    } catch {
      Alert.alert('Export Failed', 'Unable to export. Please try again.', [{ text: 'OK' }]);
    } finally {
      setIsExporting(false);
    }
  };

  const handleBulkExport = () => {
    if (selectedIds.size === 0) return;
    triggerButtonPress();
    Alert.alert(
      'Export Format',
      `Export ${selectedIds.size} ${selectedIds.size === 1 ? 'record' : 'records'} as:`,
      [
        { text: 'PDF', onPress: () => runBulkExport(exportCollectionToPDF) },
        { text: 'JSON', onPress: () => runBulkExport(exportCollectionAsJSON) },
        { text: 'Images (ZIP)', onPress: () => runBulkExport(exportImageAssetsZip) },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const handleItemPress = (item: AnalysisResult) => {
    router.push({
      pathname: '/(tabs)/(scanner)/result',
      params: { resultData: JSON.stringify(item), source: `portfolio-${activeTab}` },
    });
  };

  const getSortedCollection = () => {
    let filtered = [...collection];

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter((item) => item.name.toLowerCase().includes(query));
    }

    switch (sortBy) {
      case 'Highest Value':
        return filtered.sort((a, b) => b.estimatedValue - a.estimatedValue);
      case 'Lowest Value':
        return filtered.sort((a, b) => a.estimatedValue - b.estimatedValue);
      case 'Newest':
        return filtered.sort((a, b) => b.createdAt - a.createdAt);
      case 'Oldest':
        return filtered.sort((a, b) => a.createdAt - b.createdAt);
      case 'Recently Collected':
        return filtered.sort((a, b) => (b.collectionDate ?? b.createdAt) - (a.collectionDate ?? a.createdAt));
      case 'Earliest Collected':
        return filtered.sort((a, b) => (a.collectionDate ?? a.createdAt) - (b.collectionDate ?? b.createdAt));
      case 'A-Z':
        return filtered.sort((a, b) => a.name.localeCompare(b.name));
      default:
        return filtered;
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

      {/* Backpopulate progress banner */}
      {isBackpopulating && backpopProgress && (
        <View style={styles.backpopBanner}>
          <ActivityIndicator size="small" color={colors.accentPrimary} />
          <View style={{ flex: 1, marginLeft: spacing.sm }}>
            <Text style={styles.backpopBannerText}>
              Enriching {backpopProgress.current}/{backpopProgress.total}...
            </Text>
            <Text style={styles.backpopBannerSubtext} numberOfLines={1}>
              {backpopProgress.currentItem}
            </Text>
          </View>
        </View>
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

  const renderAllTab = () => {
    const sortedItems = getSortedCollection();
    const allSelected = sortedItems.length > 0 && selectedIds.size === sortedItems.length;

    return (
      <View style={styles.allContainer}>
        {isSelecting ? (
          /* Selection header */
          <View style={styles.selectionHeader}>
            <TouchableOpacity
              style={styles.selectAllRow}
              onPress={handleSelectAll}
              activeOpacity={0.7}
            >
              <View style={[styles.bulkCheckbox, allSelected && styles.bulkCheckboxActive]}>
                {allSelected && <Ionicons name="checkmark" size={16} color={colors.white} />}
              </View>
              <Text style={styles.selectAllText}>Select All ({sortedItems.length})</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={exitSelectionMode} activeOpacity={0.7}>
              <Text style={styles.cancelSelectText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {/* Search Bar */}
            <View style={styles.searchContainer}>
              <Ionicons name="search" size={16} color={colors.textTertiary} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search records..."
                placeholderTextColor={colors.textTertiary}
                value={searchQuery}
                onChangeText={setSearchQuery}
                returnKeyType="search"
                autoCorrect={false}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')} activeOpacity={0.7}>
                  <Ionicons name="close-circle" size={18} color={colors.textTertiary} />
                </TouchableOpacity>
              )}
            </View>

            {/* Sort/Filter Row + Bulk Action */}
            <View style={styles.sortRow}>
              {appConfig.collection.sortOptions && (
                <TouchableOpacity
                  style={styles.sortButton}
                  activeOpacity={0.7}
                  onPress={() => setShowSortMenu(true)}
                >
                  <Ionicons name="funnel-outline" size={16} color={colors.textSecondary} />
                  <Text style={styles.sortText}>{sortBy}</Text>
                  <Ionicons name="chevron-down" size={14} color={colors.textSecondary} />
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={styles.bulkSelectButton}
                activeOpacity={0.7}
                onPress={() => {
                  triggerButtonPress();
                  setIsSelecting(true);
                }}
              >
                <Ionicons name="checkmark-circle-outline" size={18} color={colors.textSecondary} />
                <Text style={styles.sortText}>Select</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </View>
    );
  };

  const handleCreateSet = () => {
    const trimmed = newSetName.trim();
    if (!trimmed) return;
    createSet(trimmed);
    setNewSetName('');
    setShowCreateSet(false);
  };

  const handleSetKebab = (s: CollectionSet) => {
    triggerButtonPress();
    Alert.alert(
      s.name,
      undefined,
      [
        {
          text: 'Rename',
          onPress: () => {
            Alert.prompt(
              'Rename Set',
              undefined,
              (text) => {
                const trimmed = text?.trim();
                if (trimmed) renameSet(s.id, trimmed);
              },
              'plain-text',
              s.name
            );
          },
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'Delete Set',
              `Delete "${s.name}"? Items will stay in your collection.`,
              [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Delete', style: 'destructive', onPress: () => deleteSet(s.id) },
              ]
            );
          },
        },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const renderSetCard = (setItem: CollectionSet) => {
    const items = getItemsInSet(setItem.id);
    const value = getSetValue(setItem.id);
    const coverUri = items[0]?.imageUri;
    const updatedDate = new Date(setItem.updatedAt).toLocaleDateString();

    return (
      <TouchableOpacity
        key={setItem.id}
        style={styles.setCard}
        activeOpacity={0.7}
        onPress={() => {
          router.push({
            pathname: '/(tabs)/(scanner)/setdetail',
            params: { setId: setItem.id },
          });
        }}
      >
        {/* Cover image */}
        <View style={styles.setCoverWrap}>
          {coverUri ? (
            <Image source={{ uri: coverUri }} style={styles.setCoverImage} contentFit="cover" />
          ) : (
            <View style={styles.setCoverPlaceholder}>
              <Ionicons name="albums" size={32} color={colors.border} />
            </View>
          )}
        </View>

        {/* Info */}
        <View style={styles.setCardInfo}>
          <View style={styles.setValueRow}>
            <Text style={styles.setValueText}>
              ${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </Text>
            <Text style={styles.setItemCount}> · {items.length} {items.length === 1 ? 'record' : 'records'}</Text>
          </View>
          <Text style={styles.setCardName} numberOfLines={1}>{setItem.name}</Text>
          <View style={styles.setFooterRow}>
            <Text style={styles.setUpdatedText}>Updated: {updatedDate}</Text>
            <TouchableOpacity
              onPress={(e) => {
                e.stopPropagation();
                handleSetKebab(setItem);
              }}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              activeOpacity={0.5}
            >
              <Ionicons name="ellipsis-vertical" size={18} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderSetsTab = () => (
    <View style={styles.setsContainer}>
      {/* Create New Set button */}
      <TouchableOpacity
        style={styles.createSetButton}
        onPress={() => setShowCreateSet(true)}
        activeOpacity={0.7}
      >
        <Ionicons name="add-circle" size={22} color={colors.accentPrimary} />
        <Text style={styles.createSetText}>Create New Set</Text>
      </TouchableOpacity>

      {/* Set cards */}
      {sets.length > 0 ? (
        sets.map(renderSetCard)
      ) : (
        <View style={styles.setsEmptyState}>
          <Ionicons name="albums-outline" size={48} color={colors.border} />
          <Text style={styles.setsEmptyText}>No sets yet</Text>
          <Text style={styles.setsEmptySubtext}>Create a set to group your records</Text>
        </View>
      )}
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

  const handleItemAddBarcode = (item: AnalysisResult) => {
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
              const discogs = await searchByBarcode(trimmed);
              if (discogs) {
                updateCollectionItem(item.id, buildDiscogsUpdates(discogs));
                Alert.alert('Barcode Added', 'Discogs data enriched successfully.');
              } else {
                Alert.alert('Barcode Saved', 'No Discogs match found.');
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
          const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: false, quality: 0.8 });
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

  const handleItemManagePhotos = async (item: AnalysisResult) => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permission Required', 'Please grant photo library access.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsMultipleSelection: true, selectionLimit: 3, quality: 0.8 });
    if (result.canceled || result.assets.length === 0) return;

    const newUris = result.assets.map((a) => a.uri);
    const existing = item.images?.length ? item.images : item.imageUri ? [item.imageUri] : [];

    if (existing.length > 0) {
      Alert.alert('Photos', `You have ${existing.length} existing photo${existing.length > 1 ? 's' : ''}.`, [
        { text: 'Replace All', onPress: () => updateCollectionItem(item.id, { images: newUris, imageUri: newUris[0] }) },
        { text: 'Add to Existing', onPress: () => { const merged = [...existing, ...newUris]; updateCollectionItem(item.id, { images: merged, imageUri: merged[0] }); } },
        { text: 'Cancel', style: 'cancel' },
      ]);
    } else {
      updateCollectionItem(item.id, { images: newUris, imageUri: newUris[0] });
    }
  };

  const handleItemReanalyze = async (item: AnalysisResult) => {
    if (reanalyzingId) return;
    setReanalyzingId(item.id);
    try {
      const existingImages = item.images?.length ? item.images : item.imageUri ? [item.imageUri] : [];
      const capturedImages: CapturedImage[] = existingImages.map((uri, i) => ({
        type: (i === 0 ? 'front' : i === 1 ? 'back' : 'label') as CapturedImage['type'],
        uri,
      }));

      let discogsData = item.barcode ? await searchByBarcode(item.barcode) : null;
      if (!discogsData && item.name) {
        discogsData = await searchByQuery(item.name.replace(/\s*[—–-]\s*/g, ' ').replace(/\([^)]*\)/g, '').trim());
      }

      const result = await analyzeImages(capturedImages, discogsData, item.barcode);
      updateCollectionItem(item.id, {
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
      });
      Alert.alert('Re-analysis Complete', 'Item data has been refreshed.');
    } catch (err) {
      Alert.alert('Re-analysis Failed', err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setReanalyzingId(null);
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
          text: item.barcode ? 'Update Barcode' : 'Add Barcode',
          onPress: () => handleItemAddBarcode(item),
        },
        {
          text: 'Add / Replace Photos',
          onPress: () => handleItemManagePhotos(item),
        },
        {
          text: reanalyzingId === item.id ? 'Re-analyzing...' : 'Re-analyze',
          onPress: () => handleItemReanalyze(item),
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
            <View style={styles.selectableRow}>
              {isSelecting && (
                <TouchableOpacity
                  style={styles.bulkCheckboxWrap}
                  onPress={() => toggleSelectItem(item.id)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.bulkCheckbox, selectedIds.has(item.id) && styles.bulkCheckboxActive]}>
                    {selectedIds.has(item.id) && <Ionicons name="checkmark" size={16} color={colors.white} />}
                  </View>
                </TouchableOpacity>
              )}
              <View style={styles.selectableCardWrap}>
                <CollectionCard
                  item={item}
                  onPress={() => {
                    if (isSelecting) {
                      toggleSelectItem(item.id);
                    } else {
                      handleItemPress(item);
                    }
                  }}
                  onKebabPress={isSelecting ? undefined : () => handleKebabPress(item)}
                  onLongPress={!isSelecting ? () => {
                    triggerButtonPress();
                    setIsSelecting(true);
                    setSelectedIds(new Set([item.id]));
                  } : undefined}
                />
              </View>
            </View>
          ) : null
        )}
        ListHeaderComponent={
          <>
            {/* Page kebab menu */}
            {collection.length > 0 && (
              <View style={styles.pageMenuRow}>
                <TouchableOpacity
                  style={styles.pageKebab}
                  onPress={() => setShowPageMenu(true)}
                  activeOpacity={0.7}
                >
                  <Ionicons name="ellipsis-horizontal" size={22} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>
            )}

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

      {/* Page kebab menu modal */}
      <Modal
        visible={showPageMenu}
        transparent
        animationType="fade"
        onRequestClose={() => setShowPageMenu(false)}
      >
        <Pressable style={styles.sortOverlay} onPress={() => setShowPageMenu(false)}>
          <View style={styles.sortDropdown}>
            <TouchableOpacity
              style={styles.pageMenuItem}
              onPress={handleBackpopulateDiscogs}
              activeOpacity={0.7}
              disabled={isBackpopulating}
            >
              <Ionicons name="disc-outline" size={20} color={colors.accentPrimary} />
              <Text style={styles.pageMenuItemText}>Enrich from Discogs</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.pageMenuItem}
              onPress={handleDeleteAllData}
              activeOpacity={0.7}
            >
              <Ionicons name="trash-outline" size={20} color={colors.error} />
              <Text style={styles.pageMenuItemTextDestructive}>Delete All Data</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>

      {/* Create Set modal */}
      <Modal
        visible={showCreateSet}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCreateSet(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.createSetOverlay}
        >
          <Pressable style={styles.createSetOverlayPress} onPress={() => setShowCreateSet(false)} />
          <View style={styles.createSetSheet}>
            <Text style={styles.createSetTitle}>New Set</Text>
            <TextInput
              style={styles.createSetInput}
              value={newSetName}
              onChangeText={setNewSetName}
              placeholder="Set name"
              placeholderTextColor={colors.textTertiary}
              autoFocus
              returnKeyType="done"
              onSubmitEditing={handleCreateSet}
            />
            <TouchableOpacity
              style={[styles.createSetDone, !newSetName.trim() && styles.createSetDoneDisabled]}
              onPress={handleCreateSet}
              disabled={!newSetName.trim()}
              activeOpacity={0.7}
            >
              <Text style={styles.createSetDoneText}>Done</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Bulk action bottom bar */}
      {isSelecting && (
        <SafeAreaView edges={['bottom']} style={styles.bulkActionBar}>
          <TouchableOpacity style={styles.bulkAction} onPress={handleBulkDelete} activeOpacity={0.7}>
            <Ionicons name="trash-outline" size={22} color={colors.error} />
            <Text style={[styles.bulkActionText, { color: colors.error }]}>Delete</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.bulkAction}
            onPress={() => {
              if (selectedIds.size === 0) return;
              triggerButtonPress();
              setShowBulkMove(true);
            }}
            activeOpacity={0.7}
          >
            <Ionicons name="cube-outline" size={22} color={colors.textPrimary} />
            <Text style={styles.bulkActionText}>Move</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.bulkAction} onPress={handleBulkExport} activeOpacity={0.7}>
            <Ionicons name="download-outline" size={22} color={colors.textPrimary} />
            <Text style={styles.bulkActionText}>Export</Text>
          </TouchableOpacity>
        </SafeAreaView>
      )}

      {/* Bulk Move Modal */}
      <BulkMoveModal
        visible={showBulkMove}
        itemIds={Array.from(selectedIds)}
        onDone={() => {
          setShowBulkMove(false);
          exitSelectionMode();
        }}
        onClose={() => setShowBulkMove(false)}
      />
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceSubtle,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    marginBottom: spacing.sm,
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: colors.textPrimary,
    padding: 0,
  },
  sortRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  bulkSelectButton: {
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
    marginBottom: spacing.md,
  },
  createSetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.accentBorder,
    borderRadius: borderRadius.md,
    borderStyle: 'dashed',
    backgroundColor: colors.accentSurface,
  },
  createSetText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.accentPrimary,
  },
  setCard: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceElevated,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    marginBottom: spacing.md,
  },
  setCoverWrap: {
    width: 100,
    height: 100,
  },
  setCoverImage: {
    width: 100,
    height: 100,
  },
  setCoverPlaceholder: {
    width: 100,
    height: 100,
    backgroundColor: colors.surfaceSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  setCardInfo: {
    flex: 1,
    padding: spacing.md,
    justifyContent: 'center',
  },
  setValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  setValueText: {
    fontSize: 18,
    fontWeight: '700',
    fontFamily: 'PlayfairDisplay_700Bold',
    color: colors.accentPrimary,
  },
  setItemCount: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  setCardName: {
    fontSize: 15,
    fontWeight: '500',
    color: colors.textPrimary,
    marginTop: 4,
  },
  setFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  setUpdatedText: {
    fontSize: 12,
    color: colors.textTertiary,
  },
  setsEmptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl,
  },
  setsEmptyText: {
    ...typography.body,
    color: colors.textSecondary,
    fontWeight: '500',
    marginTop: spacing.md,
  },
  setsEmptySubtext: {
    ...typography.caption,
    color: colors.textTertiary,
    marginTop: spacing.xs,
  },
  // Create Set modal
  createSetOverlay: {
    flex: 1,
    justifyContent: 'center',
  },
  createSetOverlayPress: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  createSetSheet: {
    backgroundColor: colors.backgroundSecondary,
    borderRadius: borderRadius.lg,
    marginHorizontal: spacing.xl,
    padding: spacing.xl,
  },
  createSetTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  createSetInput: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    fontSize: 16,
    color: colors.textPrimary,
    marginBottom: spacing.lg,
  },
  createSetDone: {
    backgroundColor: colors.accentPrimary,
    borderRadius: borderRadius.md,
    paddingVertical: 14,
    alignItems: 'center',
  },
  createSetDoneDisabled: {
    opacity: 0.4,
  },
  createSetDoneText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.white,
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
  // Page kebab menu
  pageMenuRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: spacing.xs,
  },
  pageKebab: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pageMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: 14,
  },
  pageMenuItemText: {
    ...typography.body,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  pageMenuItemTextDestructive: {
    ...typography.body,
    color: colors.error,
    fontWeight: '600',
  },
  backpopBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceSubtle,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginBottom: spacing.md,
  },
  backpopBannerText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.accentPrimary,
  },
  backpopBannerSubtext: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
  // Selection mode
  selectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
    paddingVertical: spacing.sm,
  },
  selectAllRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  selectAllText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.accentPrimary,
  },
  cancelSelectText: {
    fontSize: 15,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  selectableRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectableCardWrap: {
    flex: 1,
  },
  bulkCheckboxWrap: {
    paddingRight: spacing.sm,
    justifyContent: 'center',
  },
  bulkCheckbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bulkCheckboxActive: {
    backgroundColor: colors.accentPrimary,
    borderColor: colors.accentPrimary,
  },
  // Bulk action bar
  bulkActionBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.borderSubtle,
    backgroundColor: colors.background,
  },
  bulkAction: {
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.lg,
  },
  bulkActionText: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.textPrimary,
  },
});
