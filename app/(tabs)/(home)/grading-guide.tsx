import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { GRADING_INFO, GradingInfoEntry } from '@/utils/conditionPricing';
import { colors, spacing, borderRadius, typography } from '@/theme';

const BADGE_COLORS: Record<string, string> = {
  M: '#4CAF50',
  NM: '#66BB6A',
  'VG+': '#42A5F5',
  VG: '#FFA726',
  'G+': '#FF7043',
  G: '#EF5350',
  F: '#AB47BC',
  P: '#78909C',
};

function GradeCard({ entry }: { entry: GradingInfoEntry }) {
  const badgeColor = BADGE_COLORS[entry.abbrev] ?? colors.textSecondary;

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={[styles.badge, { backgroundColor: badgeColor }]}>
          <Text style={styles.badgeText}>{entry.abbrev}</Text>
        </View>
        <View style={styles.cardTitleArea}>
          <Text style={styles.gradeName}>{entry.grade}</Text>
          <Text style={styles.gradePercent}>{entry.goldminePercent} of NM value</Text>
        </View>
      </View>

      <View style={styles.descSection}>
        <View style={styles.descRow}>
          <Ionicons name="disc-outline" size={16} color={colors.textSecondary} style={styles.descIcon} />
          <View style={styles.descContent}>
            <Text style={styles.descLabel}>Vinyl</Text>
            <Text style={styles.descText}>{entry.vinylDesc}</Text>
          </View>
        </View>
        <View style={styles.descRow}>
          <Ionicons name="albums-outline" size={16} color={colors.textSecondary} style={styles.descIcon} />
          <View style={styles.descContent}>
            <Text style={styles.descLabel}>Sleeve</Text>
            <Text style={styles.descText}>{entry.sleeveDesc}</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

export default function GradingGuideScreen() {
  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.headerSafe}>
        <View style={styles.headerBar}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <Ionicons name="chevron-back" size={22} color={colors.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Goldmine Grading Guide</Text>
          <View style={styles.headerSpacer} />
        </View>
      </SafeAreaView>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.intro}>
          The Goldmine Grading Standard is the industry standard for buying and
          selling vinyl records. Grades describe both the vinyl and the sleeve
          separately.
        </Text>

        {GRADING_INFO.map((entry) => (
          <GradeCard key={entry.abbrev} entry={entry} />
        ))}

        <Text style={styles.footer}>
          Based on the Goldmine Grading Standard {'\u2014'} the industry standard
          for buying and selling vinyl records.
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  headerSafe: {
    backgroundColor: colors.background,
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surfaceSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 36,
  },
  scrollContent: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xxl,
  },
  intro: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
    lineHeight: 22,
  },
  card: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  badge: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  badgeText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  cardTitleArea: {
    flex: 1,
  },
  gradeName: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  gradePercent: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  descSection: {
    gap: spacing.sm,
  },
  descRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  descIcon: {
    marginTop: 2,
    marginRight: spacing.sm,
  },
  descContent: {
    flex: 1,
  },
  descLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  descText: {
    fontSize: 14,
    color: colors.textBody,
    lineHeight: 20,
  },
  footer: {
    ...typography.caption,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.md,
    fontStyle: 'italic',
  },
});
