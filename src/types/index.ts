// Core type definitions for the Vision Identifier App

export interface OnboardingSlide {
  id: string;
  title: string;
  body: string;
  image: any; // require() asset
}

export interface PaywallFeature {
  text: string;
  icon: string; // Ionicons name
}

export interface ThemeConfig {
  mode: 'dark' | 'light';

  // Background colors
  backgroundPrimary: string;
  backgroundSecondary: string;
  backgroundTertiary: string;

  // Text colors
  textPrimary: string;
  textSecondary: string;
  textTertiary: string;

  // Accent colors
  accentPrimary: string;
  accentSecondary: string;
  accentTertiary: string;

  // Gradient colors
  gradientStart: string;
  gradientEnd: string;
  gradientAccentStart: string;
  gradientAccentEnd: string;

  // Semantic colors
  successColor: string;
  errorColor: string;
  borderColor: string;
  borderColorLight: string;

  // Special colors
  premiumGold: string;
  overlayDark: string;

  // Fonts
  fontFamily: string;
  priceFontFamily: string;

  // Visual options
  showLaurelWreaths: boolean;
  enableGradients: boolean;

  // Legacy light mode compatibility
  primaryColor?: string;
  accentColor?: string;
  backgroundColor?: string;
  cardBackgroundColor?: string;
  textColor?: string;
  secondaryTextColor?: string;
}

export interface ScannerConfig {
  instructionText: string;
  galleryButtonText: string;
  analyzeButtonText: string;
  frontCoverButtonText?: string;
  backCoverButtonText?: string;
  labelButtonText?: string;
  runAnalysisButtonText?: string;
}

export interface CapturedImage {
  type: 'front' | 'back' | 'label';
  uri: string;
}

export interface ScanCart {
  images: CapturedImage[];
  currentStep: 'front' | 'back' | 'label' | 'ready';
}

export interface ResultLabels {
  name: string;
  origin: string;
  year: string;
  estimatedValue: string;
  confidence: string;
  description: string;
  addToCollection: string;
}

export interface ContentCardConfig {
  enabled: boolean;
  title: string;
  description: string;
  image?: any;
}

export interface SplashConfig {
  showGoldenGlow: boolean;
  autoTransitionMs: number;
  backgroundImage?: any; // require() asset — template reuse
}

export interface TrialToggleLabel {
  label: string;
  sublabel?: string;
}

export interface CarouselItem {
  id: string;
  title: string;
  subtitle?: string;
  image?: any;
}

export interface PromoBannerConfig {
  enabled: boolean;
  title: string;
  subtitle?: string;
  image?: any;
}

export interface HomeConfig {
  heroTitle: string;
  heroSubtitle: string;
  heroImage?: any;
  primaryCtaText: string;
  secondaryCtaText: string;
  showGradingButton: boolean;
  emptyState: {
    image?: any;
    title: string;
    showGoldenRing: boolean;
  };
  promoBanner?: PromoBannerConfig;
  cards: {
    itemOfDay: ContentCardConfig & {
      placeholderValue?: string;
      placeholderName?: string;
    };
    expertPicks: ContentCardConfig & {
      items?: CarouselItem[];
    };
    educational: ContentCardConfig & {
      items?: CarouselItem[];
    };
  };
}

export interface SnapTipExample {
  type: 'good' | 'bad';
  image: any;
  caption: string;
}

export interface SnapTipsConfig {
  enabled: boolean;
  title: string;
  tips: { text: string; icon: string }[];
  goodExamples: SnapTipExample[];
  badExamples: SnapTipExample[];
  ctaText: string;
}

export interface CollectionConfig {
  title: string;
  totalValueLabel: string;
  totalItemsLabel: string;
  showBestItems: boolean;
  showStatistics: boolean;
  showGeographicInsights: boolean;
  emptyStateText: string;
  emptyStateSubtext: string;
  exportCollectionText: string;
  exportDataText?: string;
  currencyLabel: string;
  tabs: { key: string; label: string }[];
  statsLabels: {
    itemCount: string;
    issuerCount: string;
  };
  gradeOptions?: string[];
  filterOptions?: string[];
  sortOptions?: string[];
  spotlightLabels?: {
    title: string;
    mostValuable: string;
    mostAncient: string;
    rarest: string;
  };
  geographicLabels?: {
    title: string;
    viewAll: string;
    regionSummary: string; // "{items} items distributed in {regions} regions"
  };
}

export interface OnboardingTestimonial {
  name: string;
  stars: number;
  text: string;
}

export interface OnboardingStats {
  show: boolean;
  ratingNumber: string; // e.g. "4.7" — displayed large with laurels
  ratingCount: string; // e.g. "150,000+ 5-Star Ratings"
  accuracyNumber: string; // e.g. "99%" — displayed large with laurels
  accuracyLabel: string; // e.g. "Accuracy"
  users: string;
}

export interface PaywallConfig {
  showHeroImage: boolean;
  heroImage?: any;
  pricingCardStyle: 'inline' | 'cards' | 'toggle';
  headline: string;
  subheadline: string;
  yearlyPrice: string;
  weeklyPrice: string;
  monthlyPrice: string;
  trialDays: number;
  trialToggleLabels: [TrialToggleLabel, TrialToggleLabel];
  yearlyPriceSubtext: string;
  showReminderToggle: boolean;
  reminderToggleText: string;
  footerLinks: string[];
  features: PaywallFeature[];
  ctaText: string;
  skipText: string;
}

// Deprecated, keeping for backwards compatibility
export interface PortfolioConfig {
  title: string;
  totalValueLabel: string;
  emptyStateText: string;
  emptyStateSubtext: string;
  exportCollectionText: string;
}

export interface ResultUpsellConfig {
  enabled: boolean;
  text: string;
  subtitle?: string;
  icon?: string; // Ionicons name
}

export interface ResultConfig {
  currencySymbol: string;
  labels: ResultLabels;
  upsellCta?: ResultUpsellConfig;
  showFeedback?: boolean;
  forceSaveText?: string;
}

export interface AiConfig {
  provider: 'gemini';
  model: string;
  systemPrompt: string;
  maxTokens: number;
  temperature: number;
  responseSchema: { fields: string[] };
}

export interface AsoConfig {
  reviewThresholdValue: number; // Trigger review if item value > this amount
}

export interface AppConfig {
  appName: string;
  appSlug: string;
  appDescription: string;
  splash: SplashConfig;
  debugMode: boolean;
  theme: ThemeConfig;
  onboarding: {
    slides: OnboardingSlide[];
    stats: OnboardingStats;
    backgroundImage?: any; // Full-bleed bg for social-proof screen
    testimonials?: OnboardingTestimonial[];
    badgeLabel?: string; // e.g. "Essential Reference Apps"
    tagline?: string; // e.g. "Want to know how much your stamps are worth?"
    ctaText?: string; // e.g. "Let's Go!"
    footerText?: string; // e.g. "FREE FOR 7 DAYS, THEN $59.99/YEAR"
  };
  paywall: PaywallConfig;
  home: HomeConfig;
  snapTips: SnapTipsConfig;
  loadingSteps: string[];
  scanner: ScannerConfig;
  result: ResultConfig;
  collection: CollectionConfig;
  portfolio?: PortfolioConfig; // Deprecated, for backwards compatibility
  ai: AiConfig;
  aso: AsoConfig;
}

// Extended detail structures for result screen
export interface ExtendedDetailItem {
  label: string;
  value: string;
}

export interface ExtendedDetailSection {
  title: string;
  icon?: string; // Ionicons name
  items: ExtendedDetailItem[];
}

// Analysis result from AI (or mock)
export interface AnalysisResult {
  id: string;
  name: string;
  origin: string;
  year: string;
  estimatedValue: number;
  estimatedValueLow?: number; // For price range display (e.g. $0.59)
  estimatedValueHigh?: number; // For price range display (e.g. $1.40)
  confidence: number; // 0-100
  description: string;
  imageUri?: string;
  images?: string[]; // Multiple image URIs (front, back, detail, etc.)
  createdAt: number; // timestamp
  countryCode?: string; // ISO 3166-1 alpha-3 (e.g. "USA") — indexable in Supabase
  label?: string; // Record label (e.g. "Columbia Records", "Blue Note")
  genre?: string; // Music genre (e.g. "Rock", "Jazz", "Electronic")
  rarity?: string; // e.g. 'Very Common', 'Common', 'Uncommon', 'Rare', 'Very Rare', 'Extremely Rare'
  condition?: string; // e.g. 'Mint', 'AU', 'VF', 'F', 'VG', 'G', 'Fair', 'Poor', 'Uncertain'
  albumArtQuery?: string; // Search query for scraping official album art (e.g. "Artist - Album - Year")
  collectionDate?: number; // Editable collection date (defaults to createdAt)
  notes?: string; // User-editable notes
  extendedDetails?: ExtendedDetailSection[];
}

// Geographic origin distribution for map display
export interface OriginDistribution {
  origin: string;
  count: number;
  lat: number;
  lng: number;
}

// Zustand store state
export interface AppStore {
  // Onboarding & Paywall state
  hasCompletedOnboarding: boolean;
  hasSeenPaywall: boolean;
  isPremium: boolean;

  // Collection state
  collection: AnalysisResult[];
  scanCount: number;

  // ASO state
  hasTriggeredReview: boolean;

  // Snap tips state
  hasSeenSnapTips: boolean;

  // Supabase sync state
  profileId: string | null;
  isSyncing: boolean;
  lastSyncedAt: number | null;

  // Actions
  completeOnboarding: () => void;
  seePaywall: () => void;
  setPremium: (isPremium: boolean) => void;
  addToCollection: (item: AnalysisResult) => void;
  removeFromCollection: (id: string) => void;
  updateCollectionItem: (id: string, updates: Partial<AnalysisResult>) => void;
  incrementScanCount: () => void;
  getTotalPortfolioValue: () => number;
  triggerReview: () => void;
  markSnapTipsSeen: () => void;
  getUniqueOrigins: () => number;
  getBestItem: () => AnalysisResult | null;
  getMostAncientItem: () => AnalysisResult | null;
  getRarestItem: () => AnalysisResult | null;
  getOriginDistribution: () => OriginDistribution[];
  setProfileId: (profileId: string | null) => void;
  setSyncing: (isSyncing: boolean) => void;
  setLastSyncedAt: (timestamp: number) => void;
  clearAllData: () => Promise<void>;
  resetApp: () => void; // For testing
}
