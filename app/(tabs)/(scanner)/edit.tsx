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
import { SetPickerModal } from '@/components/SetPickerModal';
import { useAppStore } from '@/store/useAppStore';
import { appConfig } from '@/config/appConfig';
import { AnalysisResult } from '@/types';
import { colors, spacing, borderRadius } from '@/theme';
import { triggerButtonPress } from '@/utils/haptics';
import { showSuccessToast } from '@/components/SuccessToast';
import { composeDisplayName } from '@/utils/displayName';
import { applyConditionPricing } from '@/utils/conditionPricing';

const GENRE_OPTIONS = [
  'Blues', 'Rock', 'Pop', 'Jazz', 'Funk', 'Soul', 'Electronic',
  'Classical', 'Hip Hop', 'R&B', 'World', 'Country', 'Folk',
  'Metal', 'Latin', 'Reggae', 'Non-Music', 'Stage & Screen',
];

function formatDate(timestamp: number): string {
  const d = new Date(timestamp);
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${mm}/${dd}/${yyyy}`;
}

function parseDate(str: string): number | null {
  const d = new Date(str);
  return isNaN(d.getTime()) ? null : d.getTime();
}

export default function EditScreen() {
  const params = useLocalSearchParams();
  const updateCollectionItem = useAppStore((s) => s.updateCollectionItem);
  const sets = useAppStore((s) => s.sets);

  let parsedItem: AnalysisResult | null = null;
  if (params.itemData) {
    try {
      parsedItem = JSON.parse(params.itemData as string);
    } catch (e) {
      parsedItem = null;
    }
  }

  const item: AnalysisResult | null = parsedItem;

  const [artist, setArtist] = useState(item?.artist ?? '');
  const [albumName, setAlbumName] = useState(item?.albumName ?? '');
  const [pressingName, setPressingName] = useState(item?.pressingName ?? '');
  const [year, setYear] = useState(item?.year ?? '');
  const [value, setValue] = useState(item?.estimatedValue?.toString() ?? '');
  const [grade, setGrade] = useState(item?.condition ?? '');
  const [label, setLabel] = useState(item?.label ?? '');
  const [origin, setOrigin] = useState(item?.origin ?? '');
  const [genre, setGenre] = useState(item?.genre ?? '');
  const [collectionDateStr, setCollectionDateStr] = useState(
    formatDate(item?.collectionDate ?? item?.createdAt ?? Date.now())
  );
  const [notes, setNotes] = useState(item?.notes ?? '');
  const [setIds, setSetIds] = useState<string[]>(item?.setIds ?? []);
  const [showGradePicker, setShowGradePicker] = useState(false);
  const [showGenrePicker, setShowGenrePicker] = useState(false);
  const [showSetPicker, setShowSetPicker] = useState(false);

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
    const parsedDate = parseDate(collectionDateStr);
    const trimmedArtist = artist.trim();
    const trimmedAlbum = albumName.trim();
    const trimmedPressing = pressingName.trim();

    // Recalculate low/high range if condition changed and base values exist
    const finalValue = isNaN(numericValue) ? item.estimatedValue : numericValue;
    let rangeUpdates: Partial<{ estimatedValueLow: number; estimatedValueHigh: number }> = {};
    if (grade && finalValue != null && finalValue > 0) {
      // Derive range from the current saved value to maintain consistency with manual overrides
      const adjusted = applyConditionPricing(finalValue, grade);
      rangeUpdates = {
        estimatedValueLow: adjusted.estimatedValueLow,
        estimatedValueHigh: adjusted.estimatedValueHigh,
      };
    }

    updateCollectionItem(item.id, {
      artist: trimmedArtist || item.artist,
      albumName: trimmedAlbum || item.albumName,
      pressingName: trimmedPressing || undefined,
      name: composeDisplayName(
        trimmedArtist || item.artist,
        trimmedAlbum || item.albumName,
        trimmedPressing || item.pressingName
      ),
      year: year.trim() || item.year,
      estimatedValue: finalValue,
      condition: grade || undefined,
      label: label.trim() || undefined,
      origin: origin.trim() || item.origin,
      genre: genre || undefined,
      collectionDate: parsedDate ?? item.collectionDate ?? item.createdAt,
      notes: notes.trim() || undefined,
      setIds,
      ...rangeUpdates,
    });
    showSuccessToast('Changes saved');
    router.back();
  };

  const getSetDisplayText = () => {
    if (setIds.length === 0) return '';
    return sets
      .filter((s) => setIds.includes(s.id))
      .map((s) => s.name)
      .join(', ');
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
          {/* Artist */}
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Artist</Text>
            <TextInput
              style={styles.textInput}
              value={artist}
              onChangeText={setArtist}
              placeholder="e.g. Led Zeppelin"
              placeholderTextColor={colors.textTertiary}
              returnKeyType="next"
            />
          </View>

          {/* Album */}
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Album</Text>
            <TextInput
              style={styles.textInput}
              value={albumName}
              onChangeText={setAlbumName}
              placeholder="e.g. Led Zeppelin IV"
              placeholderTextColor={colors.textTertiary}
              returnKeyType="next"
            />
          </View>

          {/* Pressing */}
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Pressing</Text>
            <TextInput
              style={styles.textInput}
              value={pressingName}
              onChangeText={setPressingName}
              placeholder="e.g. 1977 UK Pressing"
              placeholderTextColor={colors.textTertiary}
              returnKeyType="next"
            />
          </View>

          {/* Year */}
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Year</Text>
            <TextInput
              style={styles.textInput}
              value={year}
              onChangeText={setYear}
              placeholder="e.g. 1967"
              placeholderTextColor={colors.textTertiary}
              keyboardType="number-pad"
              returnKeyType="next"
            />
          </View>

          {/* Label */}
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Record Label</Text>
            <TextInput
              style={styles.textInput}
              value={label}
              onChangeText={setLabel}
              placeholder="e.g. Columbia Records"
              placeholderTextColor={colors.textTertiary}
              returnKeyType="next"
            />
          </View>

          {/* Origin */}
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Country of Origin</Text>
            <TextInput
              style={styles.textInput}
              value={origin}
              onChangeText={setOrigin}
              placeholder="e.g. USA, GBR"
              placeholderTextColor={colors.textTertiary}
              returnKeyType="next"
            />
          </View>

          {/* Genre */}
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Genre</Text>
            <TouchableOpacity
              style={styles.selectRow}
              onPress={() => setShowGenrePicker(true)}
              activeOpacity={0.7}
            >
              <Text style={[styles.selectText, !genre && styles.placeholderText]}>
                {genre || 'Select genre'}
              </Text>
              <Ionicons name="chevron-down" size={18} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Custom Set */}
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Custom Set</Text>
            <TouchableOpacity
              style={styles.selectRow}
              onPress={() => setShowSetPicker(true)}
              activeOpacity={0.7}
            >
              <Text
                style={[styles.selectText, !setIds.length && styles.placeholderText]}
                numberOfLines={1}
              >
                {getSetDisplayText() || 'Optional'}
              </Text>
              <Ionicons name="chevron-down" size={18} color={colors.textSecondary} />
            </TouchableOpacity>
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

          {/* Collection Date */}
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Collection Date</Text>
            <TextInput
              style={styles.textInput}
              value={collectionDateStr}
              onChangeText={setCollectionDateStr}
              placeholder="MM/DD/YYYY"
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
            <ScrollView style={styles.pickerScroll}>
              {gradeOptions.map((option) => (
                <TouchableOpacity
                  key={option}
                  style={[styles.pickerOption, grade === option && styles.pickerOptionActive]}
                  onPress={() => {
                    setGrade(option);
                    // Auto-adjust value based on condition if base value is available
                    if (item?.baseEstimatedValue != null && item.baseEstimatedValue > 0) {
                      const adjusted = applyConditionPricing(item.baseEstimatedValue, option);
                      setValue(adjusted.estimatedValue.toString());
                    }
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
            </ScrollView>
          </View>
        </Pressable>
      </Modal>

      {/* Genre Picker Modal */}
      <Modal
        visible={showGenrePicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowGenrePicker(false)}
      >
        <Pressable style={styles.pickerOverlay} onPress={() => setShowGenrePicker(false)}>
          <View style={styles.pickerDropdown}>
            <Text style={styles.pickerTitle}>Select Genre</Text>
            <ScrollView style={styles.pickerScroll}>
              {GENRE_OPTIONS.map((option) => (
                <TouchableOpacity
                  key={option}
                  style={[styles.pickerOption, genre === option && styles.pickerOptionActive]}
                  onPress={() => {
                    setGenre(option);
                    setShowGenrePicker(false);
                  }}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.pickerOptionText,
                      genre === option && styles.pickerOptionTextActive,
                    ]}
                  >
                    {option}
                  </Text>
                  {genre === option && (
                    <Ionicons name="checkmark" size={18} color={colors.accentPrimary} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </Pressable>
      </Modal>

      {/* Set Picker Modal */}
      <SetPickerModal
        visible={showSetPicker}
        selectedSetIds={setIds}
        onDone={(ids) => {
          setSetIds(ids);
          setShowSetPicker(false);
        }}
        onClose={() => setShowSetPicker(false)}
      />
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
  // Picker modal
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
    maxHeight: 400,
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
  pickerScroll: {
    maxHeight: 340,
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
