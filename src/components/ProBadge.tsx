import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { colors, spacing, borderRadius } from '@/theme';

interface Props {
  onPress: () => void;
}

export function ProBadge({ onPress }: Props) {
  return (
    <TouchableOpacity style={styles.badge} onPress={onPress} activeOpacity={0.7}>
      <Text style={styles.text}>PRO</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  badge: {
    backgroundColor: 'rgba(232, 168, 56, 0.15)',
    borderWidth: 1,
    borderColor: '#E8A838',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: borderRadius.round,
  },
  text: {
    fontSize: 13,
    fontWeight: '800',
    color: '#E8A838',
    letterSpacing: 1,
  },
});
