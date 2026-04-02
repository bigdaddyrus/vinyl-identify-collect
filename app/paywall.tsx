import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import Purchases from 'react-native-purchases';
import { useAppStore } from '@/store/useAppStore';
import { appConfig } from '@/config/appConfig';
import { PricingCard } from '@/components/PricingCard';
import { TrialToggleCard } from '@/components/TrialToggleCard';
import { colors, typography, spacing, borderRadius } from '@/theme';
import { triggerButtonPress } from '@/utils/haptics';
import { GradientButton } from '../src/components/GradientButton';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const HERO_HEIGHT = SCREEN_HEIGHT * 0.4;

export default function PaywallScreen() {
  const seePaywall = useAppStore((state) => state.seePaywall);
  const setPremium = useAppStore((state) => state.setPremium);
  const { paywall } = appConfig;
  const params = useLocalSearchParams<{ modal?: string }>();
  const isModal = params.modal === 'true';
  const [selectedPlan, setSelectedPlan] = useState<'weekly' | 'annual'>('annual');
  const [selectedToggle, setSelectedToggle] = useState<0 | 1>(0);
  const [isPurchasing, setIsPurchasing] = useState(false);

  const handleStartTrial = async () => {
    triggerButtonPress();
    setIsPurchasing(true);
    try {
      const offerings = await Purchases.getOfferings();
      const currentOffering = offerings.current;
      if (!currentOffering) {
        throw new Error('No offerings available');
      }

      // Select package based on toggle or plan selection
      const packageId = selectedToggle === 0 ? 'annual' : 'monthly';
      const selectedPackage =
        currentOffering.availablePackages.find((p) => p.identifier === packageId) ??
        currentOffering.availablePackages[0];

      if (!selectedPackage) {
        throw new Error('No packages available');
      }

      const { customerInfo } = await Purchases.purchasePackage(selectedPackage);
      const isPremium = customerInfo.entitlements.active['premium'] !== undefined;
      setPremium(isPremium);
      seePaywall();

      if (isModal) {
        router.back();
      } else {
        router.replace('/(tabs)/(home)');
      }
    } catch (err: any) {
      if (err.userCancelled) {
        // User cancelled — do nothing
      } else {
        Alert.alert('Purchase Failed', err.message ?? 'Unable to complete purchase. Please try again.');
      }
    } finally {
      setIsPurchasing(false);
    }
  };

  const handleRestore = async () => {
    triggerButtonPress();
    try {
      const customerInfo = await Purchases.restorePurchases();
      const isPremium = customerInfo.entitlements.active['premium'] !== undefined;
      setPremium(isPremium);

      if (isPremium) {
        seePaywall();
        Alert.alert('Restored', 'Your subscription has been restored.');
        if (isModal) {
          router.back();
        } else {
          router.replace('/(tabs)/(home)');
        }
      } else {
        Alert.alert('No Purchases Found', 'We could not find any previous purchases associated with your account.');
      }
    } catch (err: any) {
      Alert.alert('Restore Failed', err.message ?? 'Unable to restore purchases. Please try again.');
    }
  };

  const handleSkip = () => {
    triggerButtonPress();
    seePaywall();
    if (isModal) {
      router.back();
    } else {
      router.replace('/(tabs)/(home)');
    }
  };

  const handleFooterLink = (link: string) => {
    if (link === 'Restore') {
      handleRestore();
    } else if (link.includes('Privacy')) {
      WebBrowser.openBrowserAsync(appConfig.legal.privacyPolicyUrl);
    } else if (link.includes('Terms') || link.includes('EULA')) {
      WebBrowser.openBrowserAsync(appConfig.legal.termsUrl);
    }
  };

  const disclaimerText =
    `${paywall.trialDays}-day free trial, then ${paywall.yearlyPrice}/year. ` +
    'Subscription automatically renews until canceled. ' +
    'Payment will be charged to your Apple ID account at confirmation of purchase. ' +
    'Cancel anytime in Settings > Subscriptions.';

  // Toggle-style paywall (primary design)
  if (paywall.pricingCardStyle === 'toggle') {
    return (
      <View style={styles.container}>
        {/* Cancel button — floats over hero */}
        <SafeAreaView edges={['top']} style={styles.cancelSafeArea}>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={handleSkip}
            activeOpacity={0.6}
            accessibilityLabel="Skip subscription"
            accessibilityRole="button"
          >
            <Text style={styles.cancelText}>{paywall.skipText}</Text>
          </TouchableOpacity>
        </SafeAreaView>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          {/* Hero image with gradient fade */}
          {paywall.showHeroImage && paywall.heroImage && (
            <View style={styles.heroSection}>
              <Image
                source={paywall.heroImage}
                style={styles.heroImage}
                contentFit="cover"
                contentPosition={{ top: -150}}
              />
              <LinearGradient
                colors={['transparent', 'rgba(5, 5, 5, 0.6)', '#050505']}
                locations={[0, 0.6, 1]}
                style={styles.heroGradient}
              />
            </View>
          )}

          {/* Content below hero */}
          <View style={styles.body}>
            {/* Headline */}
            <Text style={styles.headline}>{paywall.headline}</Text>

            {/* Features — gold checkmarks, no background */}
            <View style={styles.features}>
              {paywall.features.map((feature, index) => (
                <View key={index} style={styles.featureRow} accessibilityRole="text">
                  <View style={styles.goldCheck}>
                    <Ionicons name="checkmark" size={12} color="#050505" />
                  </View>
                  <Text style={styles.featureText}>{feature.text}</Text>
                </View>
              ))}
            </View>

            {/* Toggle cards */}
            <View style={styles.toggleRow}>
              {paywall.trialToggleLabels.map((toggle, index) => (
                <TrialToggleCard
                  key={index}
                  label={toggle.label}
                  sublabel={toggle.sublabel}
                  isSelected={selectedToggle === index}
                  onPress={() => setSelectedToggle(index as 0 | 1)}
                />
              ))}
            </View>

            {/* Price subtext */}
            <Text style={styles.priceSubtext}>{paywall.yearlyPriceSubtext}</Text>
              <GradientButton
                text={isPurchasing ? 'Processing...' : 'Continue'}
                onPress={handleStartTrial}
                disabled={isPurchasing}
              />

            {/* Apple-required fine print */}
            <Text style={styles.disclaimer}>{disclaimerText}</Text>

            {/* Footer links */}
            <View style={styles.footerLinks}>
              {paywall.footerLinks.map((link, index) => (
                <View key={index} style={styles.footerLinkWrapper}>
                  {index > 0 && <Text style={styles.footerDot}> · </Text>}
                  <TouchableOpacity
                    activeOpacity={0.6}
                    onPress={() => handleFooterLink(link)}
                    accessibilityLabel={link}
                    accessibilityRole="link"
                  >
                    <Text style={styles.footerLinkText}>{link}</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </View>
        </ScrollView>
      </View>
    );
  }

  // Cards or inline style paywall (fallback)
  const ctaText = paywall.pricingCardStyle === 'cards'
    ? paywall.ctaText
    : `${paywall.ctaText} - ${selectedPlan === 'annual' ? paywall.yearlyPrice : paywall.weeklyPrice}`;

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={handleSkip}
          activeOpacity={0.6}
          accessibilityLabel="Skip subscription"
          accessibilityRole="button"
        >
          <Text style={styles.cancelText}>{paywall.skipText}</Text>
        </TouchableOpacity>

        <ScrollView
          contentContainerStyle={styles.fallbackContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.fallbackHeader}>
            <Text style={styles.headline}>{paywall.headline}</Text>
            <Text style={styles.subheadline}>{paywall.subheadline}</Text>
          </View>

          {paywall.pricingCardStyle === 'cards' ? (
            <View style={styles.pricingCards}>
              <PricingCard
                plan="annual"
                price={paywall.yearlyPrice}
                period="year"
                isSelected={selectedPlan === 'annual'}
                isBestValue={true}
                onPress={() => setSelectedPlan('annual')}
              />
              <PricingCard
                plan="weekly"
                price={paywall.weeklyPrice}
                period="week"
                isSelected={selectedPlan === 'weekly'}
                onPress={() => setSelectedPlan('weekly')}
              />
            </View>
          ) : (
            <View style={styles.pricingCard}>
              <View style={styles.priceRow}>
                <Text style={styles.priceLabel}>Annual</Text>
                <Text style={styles.price}>{paywall.yearlyPrice}</Text>
                <Text style={styles.priceUnit}>/year</Text>
              </View>
              <Text style={styles.weeklyPrice}>or {paywall.weeklyPrice}/week</Text>
              <Text style={styles.trialText}>
                {paywall.trialDays}-day free trial · Cancel anytime
              </Text>
            </View>
          )}

          <View style={styles.features}>
            {paywall.features.map((feature, index) => (
              <View key={index} style={styles.featureRow} accessibilityRole="text">
                <View style={styles.goldCheck}>
                  <Ionicons name="checkmark" size={12} color="#050505" />
                </View>
                <Text style={styles.featureText}>{feature.text}</Text>
              </View>
            ))}
          </View>

          <TouchableOpacity
            style={[styles.ctaButton, isPurchasing && styles.ctaButtonDisabled]}
            onPress={handleStartTrial}
            activeOpacity={0.85}
            disabled={isPurchasing}
            accessibilityLabel={isPurchasing ? 'Processing purchase' : 'Start free trial'}
            accessibilityRole="button"
          >
            <Text style={styles.ctaText}>{isPurchasing ? 'Processing...' : ctaText}</Text>
          </TouchableOpacity>

          {paywall.pricingCardStyle === 'cards' && (
            <Text style={styles.trialInfo}>
              {paywall.trialDays}-day free trial, then{' '}
              {selectedPlan === 'annual' ? paywall.yearlyPrice : paywall.weeklyPrice}
            </Text>
          )}

          <Text style={styles.disclaimer}>{disclaimerText}</Text>

          {/* Footer links */}
          <View style={styles.footerLinks}>
            {paywall.footerLinks.map((link, index) => (
              <View key={index} style={styles.footerLinkWrapper}>
                {index > 0 && <Text style={styles.footerDot}> · </Text>}
                <TouchableOpacity
                  activeOpacity={0.6}
                  onPress={() => handleFooterLink(link)}
                  accessibilityLabel={link}
                  accessibilityRole="link"
                >
                  <Text style={styles.footerLinkText}>{link}</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#050505',
  },
  safeArea: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing.xxl,
  },
  cancelSafeArea: {
    position: 'absolute',
    top: 0,
    right: 0,
    zIndex: 20,
  },
  cancelButton: {
    padding: spacing.md,
    paddingRight: spacing.xl,
  },
  cancelText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: '500',
  },

  // ── Hero ──
  heroSection: {
    height: HERO_HEIGHT,
    width: '100%',
    position: 'relative',
  },
  heroImage: {
    ...StyleSheet.absoluteFillObject,
  },
  heroGradient: {
    ...StyleSheet.absoluteFillObject,
  },

  // ── Body ──
  body: {
    paddingHorizontal: spacing.xl,
  },
  headline: {
    fontSize: 28,
    fontWeight: '800',
    color: '#F5F5F5',
    textAlign: 'center',
    marginBottom: spacing.xl,
    letterSpacing: -0.3,
  },
  subheadline: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
  },

  // ── Features ──
  features: {
    marginBottom: spacing.xl,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  goldCheck: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#E8A838',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  featureText: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.85)',
    fontWeight: '400',
    flex: 1,
  },

  // ── Toggle cards ──
  toggleRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },

  // ── Price subtext ──
  priceSubtext: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.4)',
    textAlign: 'center',
    marginBottom: spacing.xl,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },

  // ── CTA button ──
  ctaButton: {
    backgroundColor: '#E8A838',
    borderRadius: borderRadius.round,
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#E8A838',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  ctaButtonDisabled: {
    opacity: 0.6,
  },
  ctaText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#050505',
    letterSpacing: 0.3,
  },

  // ── Footer ──
  footerLinks: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    marginTop: spacing.xl,
    paddingBottom: spacing.lg,
  },
  footerLinkWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  footerDot: {
    color: 'rgba(255, 255, 255, 0.25)',
    fontSize: 12,
  },
  footerLinkText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.3)',
    textDecorationLine: 'underline',
  },

  // ── Disclaimer ──
  disclaimer: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.25)',
    textAlign: 'center',
    marginTop: spacing.lg,
  },

  // ── Fallback styles (cards/inline) ──
  fallbackContent: {
    padding: spacing.xl,
    paddingTop: spacing.xxl + spacing.lg,
  },
  fallbackHeader: {
    marginBottom: spacing.xl,
  },
  pricingCards: {
    marginBottom: spacing.xl,
  },
  pricingCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.xl,
    alignItems: 'center',
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: spacing.sm,
  },
  priceLabel: {
    ...typography.body,
    color: colors.textSecondary,
    marginRight: spacing.sm,
  },
  price: {
    ...typography.h1,
    color: '#E8A838',
    fontFamily: 'PlayfairDisplay_700Bold',
  },
  priceUnit: {
    ...typography.body,
    color: colors.textSecondary,
  },
  weeklyPrice: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  trialText: {
    ...typography.caption,
    color: '#E8A838',
    fontWeight: '600',
  },
  trialInfo: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.md,
  },
});
