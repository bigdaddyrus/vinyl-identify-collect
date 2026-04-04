import { useState, useCallback, useLayoutEffect, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, ActivityIndicator, Modal, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams, useNavigation } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { CollectionCard } from '@/components/CollectionCard';
import { AddToSetModal } from '@/components/AddToSetModal';
import { BulkMoveModal } from '@/components/BulkMoveModal';
import { useAppStore } from '@/store/useAppStore';
import { appConfig } from '@/config/appConfig';
import { AnalysisResult } from '@/types';
import { colors, typography, spacing, borderRadius } from '@/theme';
import { triggerButtonPress } from '@/utils/haptics';
import { showSuccessToast } from '@/components/SuccessToast';
import { normalizeOrigin } from '@/data/countryCoordinates';
import { exportCollectionToPDF } from '@/utils/pdf';
import { exportCollectionAsJSON, exportImageAssetsZip } from '@/utils/exportCollection';

const DEFAULT_TAB_BAR_STYLE = {
  backgroundColor: '#0A0A0A',
  borderTopWidth: 0,
  paddingTop: 8,
  paddingBottom: 8,
  height: 70,
} as const;

export default function SetDetailScreen() {
  const { setId } = useLocalSearchParams<{ setId: string }>();
  const navigation = useNavigation();
  const sets = useAppStore((s) => s.sets);
  const collection = useAppStore((s) => s.collection);
  const removeItemFromSet = useAppStore((s) => s.removeItemFromSet);
  const removeFromCollection = useAppStore((s) => s.removeFromCollection);

  const [showAddModal, setShowAddModal] = useState(false);
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showBulkMove, setShowBulkMove] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [sortBy, setSortBy] = useState('Recently Collected');
  const [showSortMenu, setShowSortMenu] = useState(false);

  // Hide bottom tab bar when in selection mode
  useLayoutEffect(() => {
    // setdetail is inside (scanner) stack, so getParent() reaches the tabs navigator
    navigation.getParent()?.setOptions({
      tabBarStyle: isSelecting
        ? { display: 'none' as const }
        : DEFAULT_TAB_BAR_STYLE,
    });
  }, [isSelecting, navigation]);

  const set = sets.find((s) => s.id === setId);
  const items = setId ? collection.filter((i) => i.setIds?.includes(setId)) : [];
  const originCount = new Set(items.map((item) => normalizeOrigin(item.origin))).size;

  const sortedItems = useMemo(() => {
    const list = [...items];
    switch (sortBy) {
      case 'Highest Value':
        return list.sort((a, b) => b.estimatedValue - a.estimatedValue);
      case 'Lowest Value':
        return list.sort((a, b) => a.estimatedValue - b.estimatedValue);
      case 'Newest':
        return list.sort((a, b) => b.createdAt - a.createdAt);
      case 'Oldest':
        return list.sort((a, b) => a.createdAt - b.createdAt);
      case 'Recently Collected':
        return list.sort((a, b) => (b.collectionDate ?? b.createdAt) - (a.collectionDate ?? a.createdAt));
      case 'Earliest Collected':
        return list.sort((a, b) => (a.collectionDate ?? a.createdAt) - (b.collectionDate ?? b.createdAt));
      case 'A-Z':
        return list.sort((a, b) => a.name.localeCompare(b.name));
      default:
        return list;
    }
  }, [items, sortBy]);

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
    if (selectedIds.size === sortedItems.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(sortedItems.map((i) => i.id)));
    }
  }, [selectedIds.size, sortedItems]);

  if (!set) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.errorText}>Set not found</Text>
      </SafeAreaView>
    );
  }

  const handleBack = () => {
    triggerButtonPress();
    router.navigate({
      pathname: '/(tabs)/portfolio',
      params: { tab: 'sets' },
    });
  };

  const handleItemPress = (item: AnalysisResult) => {
    if (isSelecting) {
      toggleSelectItem(item.id);
      return;
    }
    router.push({
      pathname: '/(tabs)/(scanner)/result',
      params: { resultData: JSON.stringify(item), source: `setdetail:${setId}` },
    });
  };

  const handleItemKebab = (item: AnalysisResult) => {
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
          text: 'Remove from Set',
          onPress: () => {
            removeItemFromSet(item.id, set.id);
            showSuccessToast('Removed from set');
          },
        },
        {
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
                    showSuccessToast('Removed from collection');
                  },
                },
              ]
            );
          },
        },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const handleBulkRemoveFromSet = () => {
    if (selectedIds.size === 0) return;
    triggerButtonPress();
    Alert.alert(
      'Remove from Set',
      `Remove ${selectedIds.size} ${selectedIds.size === 1 ? 'record' : 'records'} from "${set.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          onPress: () => {
            const count = selectedIds.size;
            for (const id of selectedIds) {
              removeItemFromSet(id, set.id);
            }
            exitSelectionMode();
            showSuccessToast(`Removed ${count} ${count === 1 ? 'record' : 'records'} from set`);
          },
        },
      ]
    );
  };

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
            const count = selectedIds.size;
            for (const id of selectedIds) {
              removeFromCollection(id);
            }
            exitSelectionMode();
            showSuccessToast(`Deleted ${count} ${count === 1 ? 'record' : 'records'}`);
          },
        },
      ]
    );
  };

  const runBulkExport = async (exportFn: (items: AnalysisResult[]) => Promise<void | string>) => {
    setIsExporting(true);
    try {
      const selected = items.filter((i) => selectedIds.has(i.id));
      await exportFn(selected);
      showSuccessToast('Exported successfully');
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

  const allSelected = sortedItems.length > 0 && selectedIds.size === sortedItems.length;

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.headerSafe}>
        <View style={styles.headerBar}>
          {isSelecting ? (
            <>
              <TouchableOpacity onPress={exitSelectionMode} activeOpacity={0.7} style={styles.headerTextButton}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <View style={styles.headerTitleWrap}>
                <Text style={styles.headerTitle}>{selectedIds.size} Selected</Text>
              </View>
              <TouchableOpacity onPress={handleSelectAll} activeOpacity={0.7} style={styles.headerTextButton}>
                <Text style={styles.selectAllText}>{allSelected ? 'Deselect' : 'All'}</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <TouchableOpacity style={styles.backButton} onPress={handleBack} activeOpacity={0.7}>
                <Ionicons name="chevron-back" size={24} color={colors.white} />
              </TouchableOpacity>
              <View style={styles.headerTitleWrap}>
                <Text style={styles.headerTitle} numberOfLines={1}>{set.name}</Text>
              </View>
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => {
                  triggerButtonPress();
                  setShowAddModal(true);
                }}
                activeOpacity={0.7}
              >
                <Ionicons name="add" size={26} color={colors.white} />
              </TouchableOpacity>
            </>
          )}
        </View>
      </SafeAreaView>

      {/* Sort / Stats row + Select button */}
      {!isSelecting && (
        <View style={styles.statsRow}>
          <View style={styles.statsLeft}>
            {appConfig.collection.sortOptions && items.length > 0 ? (
              <TouchableOpacity
                style={styles.sortButton}
                activeOpacity={0.7}
                onPress={() => setShowSortMenu(true)}
                accessibilityLabel={`Sort by ${sortBy}`}
                accessibilityRole="button"
              >
                <Ionicons name="funnel-outline" size={16} color={colors.textSecondary} />
                <Text style={styles.sortText}>{sortBy}</Text>
                <Ionicons name="chevron-down" size={14} color={colors.textSecondary} />
              </TouchableOpacity>
            ) : (
              <>
                <View style={styles.statItem}>
                  <Ionicons name="albums" size={16} color={colors.accentPrimary} />
                  <Text style={styles.statText}>{items.length} {items.length === 1 ? 'record' : 'records'}</Text>
                </View>
                <View style={styles.statItem}>
                  <Ionicons name="globe" size={16} color={colors.accentPrimary} />
                  <Text style={styles.statText}>{originCount} {originCount === 1 ? 'origin' : 'origins'}</Text>
                </View>
              </>
            )}
          </View>
          {items.length > 0 && (
            <TouchableOpacity
              style={styles.selectButton}
              activeOpacity={0.7}
              onPress={() => {
                triggerButtonPress();
                setIsSelecting(true);
              }}
            >
              <Ionicons name="checkmark-circle-outline" size={18} color={colors.textSecondary} />
              <Text style={styles.selectButtonText}>Select</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      <FlatList
        data={sortedItems}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
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
                onPress={() => handleItemPress(item)}
                onKebabPress={isSelecting ? undefined : () => handleItemKebab(item)}
                onLongPress={!isSelecting ? () => {
                  triggerButtonPress();
                  setIsSelecting(true);
                  setSelectedIds(new Set([item.id]));
                } : undefined}
              />
            </View>
          </View>
        )}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="albums-outline" size={48} color={colors.border} />
            <Text style={styles.emptyText}>No records in this set</Text>
            <Text style={styles.emptySubtext}>Add records from their detail or edit screen</Text>
          </View>
        }
      />

      {/* Bulk action bar (only visible in selection mode) */}
      {isSelecting && (
        <SafeAreaView edges={['bottom']} style={styles.bulkActionBar}>
          <TouchableOpacity style={styles.bulkAction} onPress={handleBulkRemoveFromSet} activeOpacity={0.7}>
            <Ionicons name="remove-circle-outline" size={22} color={colors.textPrimary} />
            <Text style={styles.bulkActionText}>Remove</Text>
          </TouchableOpacity>
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

      {/* Add Records Modal */}
      {setId && (
        <AddToSetModal
          visible={showAddModal}
          setId={setId}
          onClose={() => setShowAddModal(false)}
        />
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

      {/* Export loading overlay */}
      {isExporting && (
        <View style={styles.exportOverlay}>
          <ActivityIndicator size="large" color={colors.accentPrimary} />
        </View>
      )}
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
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTextButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  cancelText: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  selectAllText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.accentPrimary,
  },
  headerTitleWrap: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.borderSubtle,
  },
  statsLeft: {
    flexDirection: 'row',
    gap: spacing.lg,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textSecondary,
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
  selectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: 6,
    paddingHorizontal: spacing.sm,
    backgroundColor: colors.surfaceSubtle,
    borderRadius: borderRadius.round,
  },
  selectButtonText: {
    fontSize: 13,
    color: colors.textSecondary,
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
  listContent: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xl,
    flexGrow: 1,
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
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.xxl * 2,
  },
  emptyText: {
    ...typography.body,
    color: colors.textSecondary,
    fontWeight: '500',
    marginTop: spacing.md,
  },
  emptySubtext: {
    ...typography.caption,
    color: colors.textTertiary,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
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
    paddingHorizontal: spacing.md,
  },
  bulkActionText: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.textPrimary,
  },
  exportOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
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
});
