import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  FlatList,
  Pressable,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useAppStore } from '@/store/useAppStore';
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

  const getItemSetIds = (itemId: string) =>
    collection.find((i) => i.id === itemId)?.setIds ?? [];

  const toggleItem = (itemId: string) => {
    if (getItemSetIds(itemId).includes(setId)) {
      removeItemFromSet(itemId, setId);
    } else {
      addItemToSet(itemId, setId);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Pressable style={styles.overlayPress} onPress={onClose} />

        <View style={styles.sheet}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Add Records</Text>
            <TouchableOpacity onPress={onClose} activeOpacity={0.7}>
              <Ionicons name="close" size={24} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Item list */}
          <FlatList
            data={collection}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            renderItem={({ item }) => {
              const isInSet = getItemSetIds(item.id).includes(setId);
              return (
                <TouchableOpacity
                  style={styles.itemRow}
                  onPress={() => toggleItem(item.id)}
                  activeOpacity={0.7}
                >
                  {/* Checkbox */}
                  <View style={[styles.checkbox, isInSet && styles.checkboxActive]}>
                    {isInSet && <Ionicons name="checkmark" size={16} color={colors.white} />}
                  </View>

                  {/* Image */}
                  {item.imageUri ? (
                    <Image source={{ uri: item.imageUri }} style={styles.itemImage} contentFit="cover" />
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
                <Text style={styles.emptyText}>No records in your collection</Text>
              </View>
            }
          />
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
});
