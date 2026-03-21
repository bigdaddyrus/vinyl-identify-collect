import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { SnapTipCard } from '@/components/SnapTipCard';
import { GradientButton } from '@/components/GradientButton';
import { appConfig } from '@/config/appConfig';
import { useAppStore } from '@/store/useAppStore';
import { colors, typography, spacing, borderRadius } from '@/theme';

export default function SnapTipsScreen() {
  const { snapTips } = appConfig;
  const markSnapTipsSeen = useAppStore((state) => state.markSnapTipsSeen);

  const handleContinue = () => {
    markSnapTipsSeen();
    router.back();
  };

  return (
    <View style={styles.container}>
      {/* Grab Handle */}
      <View style={styles.grabHandle} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Title */}
        <Text style={styles.title}>{snapTips.title}</Text>

        {/* Good Examples - Large Stacked Cards */}
        {snapTips.goodExamples.map((example, index) => (
          <SnapTipCard
            key={`good-${index}`}
            type={example.type}
            image={example.image}
            caption={example.caption}
            variant="large"
          />
        ))}

        {/* Bad Examples - Small Row */}
        <View style={styles.badExamplesRow}>
          {snapTips.badExamples.map((example, index) => (
            <SnapTipCard
              key={`bad-${index}`}
              type={example.type}
              image={example.image}
              caption={example.caption}
              variant="small"
            />
          ))}
        </View>

        {/* Got It Button */}
        <View style={styles.ctaContainer}>
          <GradientButton
            text={snapTips.ctaText}
            onPress={handleContinue}
          />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  grabHandle: {
    width: 40,
    height: 5,
    backgroundColor: colors.textTertiary,
    borderRadius: borderRadius.round,
    alignSelf: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
  scrollContent: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxl,
  },
  title: {
    ...typography.h2,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  badExamplesRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
    marginBottom: spacing.xl,
  },
  ctaContainer: {
    paddingHorizontal: spacing.md,
  },
});
