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
  Keyboard,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppStore } from '@/store/useAppStore';
import { colors, spacing, borderRadius, typography } from '@/theme';

interface Props {
  visible: boolean;
  selectedSetIds: string[];
  onDone: (setIds: string[]) => void;
  onClose: () => void;
}

export function SetPickerModal({ visible, selectedSetIds, onDone, onClose }: Props) {
  const sets = useAppStore((s) => s.sets);
  const createSet = useAppStore((s) => s.createSet);
  const getItemsInSet = useAppStore((s) => s.getItemsInSet);

  const [selected, setSelected] = useState<string[]>(selectedSetIds);
  const [isCreating, setIsCreating] = useState(false);
  const [newSetName, setNewSetName] = useState('');

  const toggleSet = (setId: string) => {
    setSelected((prev) =>
      prev.includes(setId) ? prev.filter((id) => id !== setId) : [...prev, setId]
    );
  };

  const handleCreateSet = () => {
    const trimmed = newSetName.trim();
    if (!trimmed) return;
    Keyboard.dismiss();
    const newSet = createSet(trimmed);
    setSelected((prev) => [...prev, newSet.id]);
    setNewSetName('');
    setIsCreating(false);
  };

  const handleDone = () => {
    onDone(selected);
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
      onShow={() => setSelected(selectedSetIds)}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.overlay}
      >
        <Pressable style={styles.overlayPress} onPress={handleClose} />

        <View style={styles.sheet}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={handleClose} activeOpacity={0.7}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Select a Set</Text>
            <TouchableOpacity onPress={handleDone} activeOpacity={0.7}>
              <Text style={styles.doneText}>Done</Text>
            </TouchableOpacity>
          </View>

          {/* Set list */}
          <FlatList
            data={sets}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            renderItem={({ item }) => {
              const isSelected = selected.includes(item.id);
              const itemCount = getItemsInSet(item.id).length;
              return (
                <TouchableOpacity
                  style={styles.setRow}
                  onPress={() => toggleSet(item.id)}
                  activeOpacity={0.7}
                >
                  <View style={styles.setIcon}>
                    <Ionicons name="albums" size={20} color={colors.accentPrimary} />
                  </View>
                  <View style={styles.setInfo}>
                    <Text style={styles.setName}>{item.name}</Text>
                    <Text style={styles.setCount}>
                      {itemCount} {itemCount === 1 ? 'item' : 'items'}
                    </Text>
                  </View>
                  {isSelected && (
                    <Ionicons name="checkmark-circle" size={24} color={colors.accentPrimary} />
                  )}
                </TouchableOpacity>
              );
            }}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>No sets yet</Text>
                <Text style={styles.emptySubtext}>Create your first set below</Text>
              </View>
            }
          />

          {/* New Set row */}
          {isCreating ? (
            <View style={styles.newSetInputRow}>
              <TextInput
                style={styles.newSetInput}
                value={newSetName}
                onChangeText={setNewSetName}
                placeholder="Set name"
                placeholderTextColor={colors.textTertiary}
                autoFocus
                returnKeyType="done"
                onSubmitEditing={handleCreateSet}
              />
              <TouchableOpacity
                style={[styles.createButton, !newSetName.trim() && styles.createButtonDisabled]}
                onPress={handleCreateSet}
                disabled={!newSetName.trim()}
                activeOpacity={0.7}
              >
                <Text style={styles.createButtonText}>Add</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.newSetRow}
              onPress={() => setIsCreating(true)}
              activeOpacity={0.7}
            >
              <View style={styles.newSetIcon}>
                <Ionicons name="add" size={20} color={colors.accentPrimary} />
              </View>
              <Text style={styles.newSetText}>New Set</Text>
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
    maxHeight: '70%',
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
  cancelText: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  doneText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.accentPrimary,
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
    backgroundColor: colors.accentSurface,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  setInfo: {
    flex: 1,
  },
  setName: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.textPrimary,
  },
  setCount: {
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
    fontWeight: '500',
  },
  emptySubtext: {
    ...typography.caption,
    color: colors.textTertiary,
    marginTop: spacing.xs,
  },
  newSetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.borderSubtle,
  },
  newSetIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surfaceSubtle,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  newSetText: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.accentPrimary,
  },
  newSetInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.borderSubtle,
    gap: spacing.sm,
  },
  newSetInput: {
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
  createButton: {
    backgroundColor: colors.accentPrimary,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: 12,
  },
  createButtonDisabled: {
    opacity: 0.4,
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.white,
  },
});
