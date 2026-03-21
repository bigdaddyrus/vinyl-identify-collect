import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius } from '@/theme';

interface Props {
  label: string;
  sublabel?: string;
  isSelected: boolean;
  onPress: () => void;
}

export function TrialToggleCard({ label, sublabel, isSelected, onPress }: Props) {
  return (
    <TouchableOpacity
      style={[styles.container, isSelected ? styles.containerSelected : styles.containerMuted]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={[styles.checkCircle, isSelected && styles.checkCircleSelected]}>
        {isSelected && (
          <Ionicons name="checkmark" size={14} color="#050505" />
        )}
      </View>
      <Text style={[styles.label, isSelected ? styles.labelSelected : styles.labelMuted]}>
        {label}
      </Text>
      {sublabel && (
        <Text style={[styles.sublabel, isSelected ? styles.sublabelSelected : styles.sublabelMuted]}>
          {sublabel}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 100,
  },
  containerSelected: {
    backgroundColor: '#1A1A1A',
    borderWidth: 0.5,
    borderColor: '#E8A838',
  },
  containerMuted: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    opacity: 0.5,
  },
  checkCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    marginBottom: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkCircleSelected: {
    borderColor: '#E8A838',
    backgroundColor: '#E8A838',
  },
  label: {
    ...typography.body,
    fontWeight: '600',
    textAlign: 'center',
  },
  labelSelected: {
    color: colors.textPrimary,
  },
  labelMuted: {
    color: colors.textTertiary,
  },
  sublabel: {
    ...typography.caption,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  sublabelSelected: {
    color: colors.textSecondary,
  },
  sublabelMuted: {
    color: colors.textTertiary,
  },
});
