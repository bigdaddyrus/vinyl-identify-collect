import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Modal,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { GradientButton } from '@/components/GradientButton';
import { useAppStore } from '@/store/useAppStore';
import { appConfig } from '@/config/appConfig';
import { AnalysisResult } from '@/types';
import { colors, spacing, borderRadius } from '@/theme';
import { triggerButtonPress } from '@/utils/haptics';

export default function EditScreen() {
  const params = useLocalSearchParams();
  const updateCollectionItem = useAppStore((s) => s.updateCollectionItem);

  let parsedItem: AnalysisResult | null = null;
  if (params.itemData) {
    try {
      parsedItem = JSON.parse(params.itemData as string);
    } catch (e) {
      parsedItem = null;
    }
  }

  const item: AnalysisResult | null = parsedItem;

  const [name, setName] = useState(item?.name ?? '');
  const [year, setYear] = useState(item?.year ?? '');
  const [value, setValue] = useState(item?.estimatedValue?.toString() ?? '');
  const [grade, setGrade] = useState(item?.condition ?? '');
  const [notes, setNotes] = useState(item?.notes ?? '');
  const [showGradePicker, setShowGradePicker] = useState(false);

  const gradeOptions = appConfig.collection.gradeOptions ?? [];

  if (!item) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.errorText}>Error: No item data found</Text>
      </SafeAreaView>
    );
  }

  const handleSave = () => {
    triggerButtonPress();
    const numericValue = parseFloat(value);
    updateCollectionItem(item.id, {
      name: name.trim() || item.name,
      year: year.trim() || item.year,
      estimatedValue: isNaN(numericValue) ? item.estimatedValue : numericValue,
      condition: grade || undefined,
      notes: notes.trim() || undefined,
    });
    router.back();
  };

  const handleClose = () => {
    triggerButtonPress();
    router.back();
  };

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.headerSafe}>
        <View style={styles.headerBar}>
          <Text style={styles.headerTitle}>Collection Details</Text>
          <TouchableOpacity style={styles.closeButton} onPress={handleClose} activeOpacity={0.7}>
            <Ionicons name="close" size={22} color={colors.white} />
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Variety / Year */}
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Variety (Year)</Text>
            <TextInput
              style={styles.textInput}
              value={year}
              onChangeText={setYear}
              placeholder="e.g. 1967"
              placeholderTextColor={colors.textTertiary}
              returnKeyType="next"
            />
          </View>

          {/* Value */}
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Value ($)</Text>
            <TextInput
              style={styles.textInput}
              value={value}
              onChangeText={setValue}
              placeholder="0.00"
              placeholderTextColor={colors.textTertiary}
              keyboardType="decimal-pad"
              returnKeyType="next"
            />
          </View>

          {/* Grade */}
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Grade</Text>
            <TouchableOpacity
              style={styles.selectRow}
              onPress={() => setShowGradePicker(true)}
              activeOpacity={0.7}
            >
              <Text style={[styles.selectText, !grade && styles.placeholderText]}>
                {grade || 'Select grade'}
              </Text>
              <Ionicons name="chevron-down" size={18} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Edit Name */}
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Edit Name</Text>
            <TextInput
              style={styles.textInput}
              value={name}
              onChangeText={setName}
              placeholder="Item name"
              placeholderTextColor={colors.textTertiary}
              returnKeyType="next"
            />
          </View>

          {/* Notes */}
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Notes</Text>
            <TextInput
              style={[styles.textInput, styles.notesInput]}
              value={notes}
              onChangeText={setNotes}
              placeholder="Add personal notes..."
              placeholderTextColor={colors.textTertiary}
              multiline
              textAlignVertical="top"
              returnKeyType="default"
            />
          </View>
        </ScrollView>

        {/* Save Button */}
        <SafeAreaView edges={['bottom']} style={styles.bottomBar}>
          <GradientButton text="Save Changes" onPress={handleSave} />
        </SafeAreaView>
      </KeyboardAvoidingView>

      {/* Grade Picker Modal */}
      <Modal
        visible={showGradePicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowGradePicker(false)}
      >
        <Pressable style={styles.pickerOverlay} onPress={() => setShowGradePicker(false)}>
          <View style={styles.pickerDropdown}>
            <Text style={styles.pickerTitle}>Select Grade</Text>
            {gradeOptions.map((option) => (
              <TouchableOpacity
                key={option}
                style={[styles.pickerOption, grade === option && styles.pickerOptionActive]}
                onPress={() => {
                  setGrade(option);
                  setShowGradePicker(false);
                }}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.pickerOptionText,
                    grade === option && styles.pickerOptionTextActive,
                  ]}
                >
                  {option}
                </Text>
                {grade === option && (
                  <Ionicons name="checkmark" size={18} color={colors.accentPrimary} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  flex: {
    flex: 1,
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
  scrollContent: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
  },
  fieldContainer: {
    marginBottom: spacing.lg,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
  },
  textInput: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    fontSize: 16,
    color: colors.textPrimary,
  },
  notesInput: {
    minHeight: 100,
    paddingTop: 14,
  },
  selectRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surfaceElevated,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
  },
  selectText: {
    fontSize: 16,
    color: colors.textPrimary,
  },
  placeholderText: {
    color: colors.textTertiary,
  },
  bottomBar: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.borderSubtle,
  },
  errorText: {
    fontSize: 16,
    color: colors.error,
    textAlign: 'center',
    padding: spacing.xl,
    marginTop: spacing.xxl,
  },
  // Grade picker modal
  pickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  pickerDropdown: {
    backgroundColor: colors.backgroundSecondary,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.sm,
    overflow: 'hidden',
  },
  pickerTitle: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  pickerOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: 14,
  },
  pickerOptionActive: {
    backgroundColor: colors.accentSurface,
  },
  pickerOptionText: {
    fontSize: 16,
    color: colors.textPrimary,
  },
  pickerOptionTextActive: {
    color: colors.accentPrimary,
    fontWeight: '600',
  },
});
