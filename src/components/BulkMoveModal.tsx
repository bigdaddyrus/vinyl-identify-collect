import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  FlatList,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppStore } from '@/store/useAppStore';
import { colors, spacing, borderRadius, typography } from '@/theme';

interface Props {
  visible: boolean;
  itemIds: string[];
  onDone: () => void;
  onClose: () => void;
}

export function BulkMoveModal({ visible, itemIds, onDone, onClose }: Props) {
  const sets = useAppStore((s) => s.sets);
  const createSet = useAppStore((s) => s.createSet);
  const addItemToSet = useAppStore((s) => s.addItemToSet);
  const getItemsInSet = useAppStore((s) => s.getItemsInSet);

  const [isCreating, setIsCreating] = useState(false);
  const [newSetName, setNewSetName] = useState('');

  const handleSelectSet = (setId: string) => {
    for (const itemId of itemIds) {
      addItemToSet(itemId, setId);
    }
    onDone();
  };

  const handleCreateSet = () => {
    const trimmed = newSetName.trim();
    if (!trimmed) return;
    const newSet = createSet(trimmed);
    setNewSetName('');
    setIsCreating(false);
    handleSelectSet(newSet.id);
  };

  const handleClose = () => {
    setIsCreating(false);
    setNewSetName('');
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.overlay}
      >
        <Pressable style={styles.overlayPress} onPress={handleClose} />

        <View style={styles.sheet}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Move to...</Text>
            <TouchableOpacity onPress={handleClose} activeOpacity={0.7}>
              <Ionicons name="close" size={24} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Set list */}
          <FlatList
            data={sets}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            renderItem={({ item }) => {
              const itemCount = getItemsInSet(item.id).length;
              return (
                <TouchableOpacity
                  style={styles.setRow}
                  onPress={() => handleSelectSet(item.id)}
                  activeOpacity={0.7}
                >
                  <View style={styles.setIcon}>
                    <Ionicons name="albums" size={20} color={colors.textSecondary} />
                  </View>
                  <Text style={styles.setName}>{item.name}</Text>
                  <Text style={styles.setCount}>({itemCount})</Text>
                </TouchableOpacity>
              );
            }}
            ListEmptyComponent={
              !isCreating ? (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyText}>No sets yet</Text>
                </View>
              ) : null
            }
          />

          {/* Create set row */}
          {isCreating ? (
            <View style={styles.createInputRow}>
              <TextInput
                style={styles.createInput}
                value={newSetName}
                onChangeText={setNewSetName}
                placeholder="Set name"
                placeholderTextColor={colors.textTertiary}
                autoFocus
                returnKeyType="done"
                onSubmitEditing={handleCreateSet}
              />
              <TouchableOpacity
                style={[styles.createDoneButton, !newSetName.trim() && styles.createDoneDisabled]}
                onPress={handleCreateSet}
                disabled={!newSetName.trim()}
                activeOpacity={0.7}
              >
                <Text style={styles.createDoneText}>Add</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.createRow}
              onPress={() => setIsCreating(true)}
              activeOpacity={0.7}
            >
              <Ionicons name="add-circle-outline" size={22} color={colors.textSecondary} />
              <Text style={styles.createText}>Create set</Text>
            </TouchableOpacity>
          )}
        </View>
      </KeyboardAvoidingView>
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
    maxHeight: '60%',
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
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: 14,
  },
  setIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surfaceSubtle,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  setName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: colors.textPrimary,
  },
  setCount: {
    fontSize: 14,
    color: colors.textSecondary,
    marginLeft: spacing.sm,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  emptyText: {
    ...typography.body,
    color: colors.textSecondary,
  },
  createRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.borderSubtle,
    gap: spacing.md,
  },
  createText: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  createInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.borderSubtle,
    gap: spacing.sm,
  },
  createInput: {
    flex: 1,
    backgroundColor: colors.surfaceElevated,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.textPrimary,
  },
  createDoneButton: {
    backgroundColor: colors.accentPrimary,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: 12,
  },
  createDoneDisabled: {
    opacity: 0.4,
  },
  createDoneText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.white,
  },
});
