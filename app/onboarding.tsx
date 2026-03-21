import { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { GradientButton } from '@/components/GradientButton';
import { useAppStore } from '@/store/useAppStore';
import { appConfig } from '@/config/appConfig';
import { colors, spacing, borderRadius } from '@/theme';
import { triggerButtonPress } from '@/utils/haptics';

// ── Laurel Wreath ───────────────────────────────────────────────
// Leaves placed along a circular arc. Right branch = scaleX: -1 mirror.

const BRANCH_W = 34;
const BRANCH_H = 74;
const ARC_R = 24;
const CX = BRANCH_W;
const CY = BRANCH_H / 2;

const ARC_ANGLES = [-55, -34, -12, 12, 34, 55];
const LEAVES = ARC_ANGLES.map((deg) => {
  const rad = (deg * Math.PI) / 180;
  return {
    left: Math.round(CX - ARC_R * Math.cos(rad)),
    top: Math.round(CY - ARC_R * Math.sin(rad)),
    rotate: deg + 45,
    size: 14,
    opacity: 0.5 + (1 - Math.abs(deg) / 55) * 0.4,
  };
});

function LaurelBranch({ mirror }: { mirror?: boolean }) {
  return (
    <View style={[
      { width: BRANCH_W, height: BRANCH_H },
      mirror && { transform: [{ scaleX: -1 }] },
    ]}>
      {LEAVES.map((leaf, i) => (
        <Ionicons
          key={i}
          name="leaf-outline"
          size={leaf.size}
          color={colors.premiumGold}
          style={{
            position: 'absolute',
            top: leaf.top - leaf.size / 2,
            left: leaf.left - leaf.size / 2,
            opacity: leaf.opacity,
            transform: [{ rotate: `${leaf.rotate}deg` }],
          }}
        />
      ))}
    </View>
  );
}

function LaurelWreath({ children }: { children: React.ReactNode }) {
  return (
    <View style={laurelStyles.row}>
      <LaurelBranch />
      <View style={laurelStyles.content}>{children}</View>
      <LaurelBranch mirror />
    </View>
  );
}

const laurelStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    alignItems: 'center',
    marginHorizontal: spacing.md,
  },
});

// ── Star Row ────────────────────────────────────────────────────
function StarRow({ count, size = 14 }: { count: number; size?: number }) {
  return (
    <View style={styles.starRow}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Ionicons
          key={i}
          name={i < count ? 'star' : 'star-outline'}
          size={size}
          color={colors.premiumGold}
        />
      ))}
    </View>
  );
}

// ── Review Card ─────────────────────────────────────────────────
function ReviewCard({ review }: { review: { name: string; stars: number; text: string } }) {
  return (
    <View style={styles.reviewCard}>
      <View style={styles.reviewHeader}>
        <Text style={styles.reviewName}>{review.name}</Text>
        <StarRow count={review.stars} />
      </View>
      <Text style={styles.reviewText}>{review.text}</Text>
    </View>
  );
}

// ── Scrolling Reviews ───────────────────────────────────────────
function ScrollingReviews() {
  const testimonials = appConfig.onboarding.testimonials ?? [];
  const scrollX = useRef(new Animated.Value(0)).current;
  const doubledReviews = [...testimonials, ...testimonials];
  const CARD_WIDTH = 260;
  const CARD_GAP = 12;
  const TOTAL_WIDTH = (CARD_WIDTH + CARD_GAP) * testimonials.length;

  useEffect(() => {
    if (testimonials.length === 0) return;
    const animation = Animated.loop(
      Animated.timing(scrollX, {
        toValue: -TOTAL_WIDTH,
        duration: TOTAL_WIDTH * 25,
        useNativeDriver: true,
      })
    );
    animation.start();
    return () => animation.stop();
  }, []);

  if (testimonials.length === 0) return null;

  return (
    <View style={styles.reviewsContainer}>
      <Animated.View
        style={[
          styles.reviewsTrack,
          { transform: [{ translateX: scrollX }] },
        ]}
      >
        {doubledReviews.map((review, index) => (
          <View key={index} style={{ marginRight: CARD_GAP }}>
            <ReviewCard review={review} />
          </View>
        ))}
      </Animated.View>
    </View>
  );
}

// ── Main Screen ─────────────────────────────────────────────────
export default function OnboardingScreen() {
  const completeOnboarding = useAppStore((state) => state.completeOnboarding);
  const { stats } = appConfig.onboarding;

  const handleContinue = () => {
    triggerButtonPress();
    completeOnboarding();
    router.replace('/paywall');
  };

  return (
    <View style={styles.container}>
      {/* Full-bleed background image — aligned top so stamp is visible */}
      {appConfig.onboarding.backgroundImage && (
        <Image
          source={appConfig.onboarding.backgroundImage}
          style={StyleSheet.absoluteFillObject}
          contentFit="cover"
          contentPosition="top center"
        />
      )}

      {/* Gradient overlay — light at top to show image, heavy at bottom */}
      <LinearGradient
        colors={[
          'rgba(5, 5, 5, 0.0)',
          'rgba(5, 5, 5, 0.25)',
          'rgba(5, 5, 5, 0.8)',
          'rgba(5, 5, 5, 0.98)',
        ]}
        locations={[0, 0.3, 0.55, 0.75]}
        style={StyleSheet.absoluteFillObject}
        pointerEvents="none"
      />

      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        {/* Top spacer — lets the background image show the stamp */}
        <View style={styles.topSpacer} />

        {/* Scrolling Reviews */}
        <ScrollingReviews />

        {/* Stats with Laurel Wreaths */}
        {stats.show && (
          <View style={styles.statsSection}>
            <LaurelWreath>
              <Text style={styles.statBigNumber}>{stats.ratingNumber}</Text>
              <StarRow count={5} size={14} />
              <Text style={styles.statSubText}>{stats.ratingCount}</Text>
            </LaurelWreath>

            <LaurelWreath>
              <Text style={styles.statBigNumber}>{stats.accuracyNumber}</Text>
              <Text style={styles.statSubText}>{stats.accuracyLabel}</Text>
            </LaurelWreath>
          </View>
        )}

        {/* Tagline */}
        {appConfig.onboarding.tagline && (
          <Text style={styles.tagline}>{appConfig.onboarding.tagline}</Text>
        )}

        {/* CTA */}
        <View style={styles.footer}>
          <GradientButton
            text={appConfig.onboarding.ctaText || "Let's Go!"}
            onPress={handleContinue}
          />
          {appConfig.onboarding.footerText && (
            <Text style={styles.footerText}>{appConfig.onboarding.footerText}</Text>
          )}
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  safeArea: {
    flex: 1,
  },
  topSpacer: {
    flex: 1,
    minHeight: 80,
  },

  // ── Stars ──
  starRow: {
    flexDirection: 'row',
    gap: 2,
    marginTop: 2,
  },

  // ── Reviews ──
  reviewsContainer: {
    height: 130,
    overflow: 'hidden',
    marginBottom: spacing.sm,
  },
  reviewsTrack: {
    flexDirection: 'row',
    paddingLeft: spacing.xl,
  },
  reviewCard: {
    width: 260,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: spacing.md,
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  reviewName: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  reviewText: {
    fontSize: 13,
    fontWeight: '400',
    color: colors.textBody,
    lineHeight: 18,
  },

  // ── Stats ──
  statsSection: {
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
  },
  statBigNumber: {
    fontSize: 38,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  statSubText: {
    fontSize: 11,
    fontWeight: '500',
    color: colors.textSecondary,
    marginTop: 2,
    textAlign: 'center',
  },

  // ── Tagline ──
  tagline: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.textPrimary,
    textAlign: 'center',
    paddingHorizontal: spacing.xl,
    marginTop: spacing.md,
    marginBottom: spacing.lg,
    letterSpacing: -0.3,
    lineHeight: 32,
  },

  // ── Footer ──
  footer: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.md,
  },
  footerText: {
    fontSize: 11,
    fontWeight: '500',
    color: colors.textTertiary,
    textAlign: 'center',
    marginTop: spacing.md,
    letterSpacing: 0.5,
  },
});
