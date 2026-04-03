import { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  FlatList,
  TextInput,
  Pressable,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useAppStore } from '@/store/useAppStore';
import { showSuccessToast } from '@/components/SuccessToast';
import { colors, spacing, borderRadius, typography } from '@/theme';

interface Props {
  visible: boolean;
  setId: string;
  onClose: () => void;
}

export function AddToSetModal({ visible, setId, onClose }: Props) {
  const collection = useAppStore((s) => s.collection);
  const addItemToSet = useAppStore((s) => s.addItemToSet);
  const removeItemFromSet = useAppStore((s) => s.removeItemFromSet);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Sync selected state from store when modal opens
  useEffect(() => {
    if (visible) {
      const currentIds = new Set<string>();
      for (const item of collection) {
        if (item.setIds?.includes(setId)) {
          currentIds.add(item.id);
        }
      }
      setSelectedIds(currentIds);
      setSearchQuery('');
    }
  }, [visible, setId]);

  const filteredCollection = useMemo(() => {
    if (!searchQuery.trim()) return collection;
    const q = searchQuery.toLowerCase().trim();
    return collection.filter((item) => item.name.toLowerCase().includes(q));
  }, [collection, searchQuery]);

  const toggleItem = (itemId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(itemId)) {
        next.delete(itemId);
      } else {
        next.add(itemId);
      }
      return next;
    });
  };

  // Compute how many changes were made vs current store state
  const originalIds = useMemo(() => {
    const ids = new Set<string>();
    for (const item of collection) {
      if (item.setIds?.includes(setId)) ids.add(item.id);
    }
    return ids;
  }, [collection, setId]);

  const hasChanges = useMemo(() => {
    if (selectedIds.size !== originalIds.size) return true;
    for (const id of selectedIds) {
      if (!originalIds.has(id)) return true;
    }
    return false;
  }, [selectedIds, originalIds]);

  const handleDone = () => {
    let added = 0;
    let removed = 0;
    // Add newly selected items
    for (const id of selectedIds) {
      if (!originalIds.has(id)) {
        addItemToSet(id, setId);
        added++;
      }
    }
    // Remove deselected items
    for (const id of originalIds) {
      if (!selectedIds.has(id)) {
        removeItemFromSet(id, setId);
        removed++;
      }
    }
    onClose();
    if (added > 0) {
      showSuccessToast(`${added} ${added === 1 ? 'record' : 'records'} added to set`);
    } else if (removed > 0) {
      showSuccessToast(`${removed} ${removed === 1 ? 'record' : 'records'} removed from set`);
    }
  };

  const handleCancel = () => {
    setSearchQuery('');
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleCancel}
    >
      <View style={styles.overlay}>
        <Pressable style={styles.overlayPress} onPress={handleCancel} />

        <View style={styles.sheet}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Add Records</Text>
            <TouchableOpacity onPress={handleCancel} activeOpacity={0.7}>
              <Ionicons name="close" size={24} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Search bar */}
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

          {/* Item list */}
          <FlatList
            data={filteredCollection}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => {
              const isSelected = selectedIds.has(item.id);
              return (
                <TouchableOpacity
                  style={styles.itemRow}
                  onPress={() => toggleItem(item.id)}
                  activeOpacity={0.7}
                >
                  {/* Checkbox */}
                  <View style={[styles.checkbox, isSelected && styles.checkboxActive]}>
                    {isSelected && <Ionicons name="checkmark" size={16} color={colors.white} />}
                  </View>

                  {/* Image */}
                  {(item.imageUri || item.discogsImage || item.discogsThumbnail) ? (
                    <Image source={{ uri: item.discogsThumbnail || item.imageUri || item.discogsImage }} style={styles.itemImage} contentFit="cover" />
                  ) : (
                    <View style={styles.itemImagePlaceholder}>
                      <Ionicons name="image" size={20} color={colors.border} />
                    </View>
                  )}

                  {/* Info */}
                  <View style={styles.itemInfo}>
                    <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
                    <Text style={styles.itemMeta} numberOfLines={1}>
                      {item.year}{item.condition ? ` · ${item.condition}` : ''}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            }}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>
                  {searchQuery.trim() ? 'No matching records' : 'No records in your collection'}
                </Text>
              </View>
            }
          />

          {/* Done button */}
          <View style={styles.doneContainer}>
            <TouchableOpacity
              style={[styles.doneButton, !hasChanges && styles.doneButtonDisabled]}
              onPress={handleDone}
              disabled={!hasChanges}
              activeOpacity={0.7}
            >
              <Text style={styles.doneText}>
                {selectedIds.size > 0
                  ? `Done (${selectedIds.size} selected)`
                  : 'Done'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  overlayPress: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  sheet: {
    backgroundColor: colors.backgroundSecondary,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    maxHeight: '75%',
    paddingBottom: spacing.xl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.borderSubtle,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceSubtle,
    borderRadius: borderRadius.md,
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
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
  listContent: {
    paddingVertical: spacing.sm,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: 10,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  checkboxActive: {
    backgroundColor: colors.accentPrimary,
    borderColor: colors.accentPrimary,
  },
  itemImage: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.sm,
    marginRight: spacing.md,
  },
  itemImagePlaceholder: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.surfaceSubtle,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 15,
    fontWeight: '500',
    color: colors.textPrimary,
  },
  itemMeta: {
    ...typography.caption,
    color: colors.textSecondary,
    fontSize: 13,
    marginTop: 2,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  emptyText: {
    ...typography.body,
    color: colors.textSecondary,
  },
  doneContainer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.borderSubtle,
  },
  doneButton: {
    backgroundColor: colors.accentPrimary,
    borderRadius: borderRadius.md,
    paddingVertical: 14,
    alignItems: 'center',
  },
  doneButtonDisabled: {
    opacity: 0.4,
  },
  doneText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.white,
  },
});
