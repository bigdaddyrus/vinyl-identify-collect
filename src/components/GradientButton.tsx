import { View, TouchableOpacity, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, gradients, typography, spacing } from '@/theme';
import { triggerButtonPress } from '@/utils/haptics';

interface Props {
  text: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary';
  icon?: keyof typeof Ionicons.glyphMap;
  style?: ViewStyle;
  textStyle?: TextStyle;
  disabled?: boolean;
}

export function GradientButton({
  text,
  onPress,
  variant = 'primary',
  icon,
  style,
  textStyle,
  disabled = false,
}: Props) {
  const handlePress = () => {
    triggerButtonPress();
    onPress();
  };

  if (variant === 'secondary') {
    return (
      <TouchableOpacity
        style={[styles.secondaryButton, disabled && styles.disabled, style]}
        onPress={handlePress}
        disabled={disabled}
        activeOpacity={0.7}
      >
        {icon && <Ionicons name={icon} size={20} color={colors.textPrimary} style={styles.icon} />}
        <Text style={[styles.secondaryButtonText, textStyle]}>{text}</Text>
      </TouchableOpacity>
    );
  }

  // Primary luxury gradient button
  return (
    <TouchableOpacity
      style={[styles.primaryButtonContainer, disabled && styles.disabled, style]}
      onPress={handlePress}
      disabled={disabled}
      activeOpacity={0.8}
    >
      <LinearGradient
        colors={gradients.luxuryGold}
        locations={gradients.luxuryGoldLocations}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        {/* Subtle top-edge highlight for metallic sheen */}
        <View style={styles.innerHighlight} />
        {icon && <Ionicons name={icon} size={20} color={colors.white} style={styles.icon} />}
        <Text style={[styles.primaryButtonText, textStyle]}>{text}</Text>
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  primaryButtonContainer: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: gradients.luxuryGoldShadow,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 6,
  },
  gradient: {
    paddingVertical: spacing.md + spacing.xs,
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    position: 'relative',
  },
  innerHighlight: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: colors.overlayMedium,
  },
  primaryButtonText: {
    ...typography.h3,
    color: colors.white,
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    backgroundColor: colors.surfaceSubtle,
  },
  secondaryButtonText: {
    ...typography.h3,
    color: colors.textPrimary,
  },
  icon: {
    marginRight: spacing.sm,
  },
  disabled: {
    opacity: 0.5,
  },
});
