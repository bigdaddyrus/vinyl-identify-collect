import { AppConfig } from '@/types';

/**
 * Single Source of Truth for all app content, theme, and configuration.
 *
 * To clone this app for a different vertical (coins, vinyl, antiques, etc.):
 * 1. Update this config file with vertical-specific content
 * 2. Replace assets in /assets/images/
 * 3. Update app.json (name, slug, bundleIdentifier)
 *
 * NO hardcoded text, colors, or logic should exist in components!
 */

export const appConfig: AppConfig = {
  appName: 'StampSnap',
  appSlug: 'stampsnap',
  appDescription: 'AI-powered stamp identification and valuation',

  splash: {
    showGoldenGlow: true,
    autoTransitionMs: 2500,
    backgroundImage: require('../../assets/images/splash-bg.png'),
  },

  debugMode: true, // Set false for production

  theme: {
    mode: 'dark',

    // Background colors
    backgroundPrimary: '#050505',
    backgroundSecondary: '#1A1A1A',
    backgroundTertiary: 'rgba(255, 255, 255, 0.05)',

    // Text colors
    textPrimary: '#F5F5F5',
    textSecondary: '#A0A0A0',
    textTertiary: '#666666',

    // Accent colors
    accentPrimary: '#E8A838',
    accentSecondary: '#D4AF37',
    accentTertiary: '#3A3A3A',

    // Gradient colors
    gradientStart: '#1A1A1A',
    gradientEnd: '#050505',
    gradientAccentStart: '#E8A838',
    gradientAccentEnd: '#D4961E',

    // Semantic colors
    successColor: '#34C759',
    errorColor: '#FF3B30',
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderColorLight: 'rgba(255, 255, 255, 0.12)',

    // Special colors
    premiumGold: '#FFD700',
    overlayDark: 'rgba(5, 5, 5, 0.95)',

    // Fonts
    fontFamily: 'System',
    priceFontFamily: 'PlayfairDisplay_700Bold',

    // Visual options
    showLaurelWreaths: true,
    enableGradients: true,

    // Legacy (for light mode fallback)
    primaryColor: '#2C5F2D',
    accentColor: '#D4AF37',
    backgroundColor: '#FFFFFF',
    cardBackgroundColor: '#F8F8F8',
    textColor: '#1A1A1A',
    secondaryTextColor: '#666666',
  },

  onboarding: {
    slides: [
      {
        id: '1',
        title: 'Discover Hidden Treasures',
        body: 'Found old stamps in your attic? Unlock their true market value.',
        image: require('../../assets/images/icon.png'), // Replace with onboarding-1.png
      },
      {
        id: '2',
        title: 'Instant AI Valuation',
        body: 'Scan any stamp and get expert-level analysis in seconds.',
        image: require('../../assets/images/icon.png'), // Replace with onboarding-2.png
      },
      {
        id: '3',
        title: 'Build Your Collection',
        body: 'Track your portfolio value and watch your collection grow.',
        image: require('../../assets/images/icon.png'), // Replace with onboarding-3.png
      },
    ],
    stats: {
      show: true,
      ratingNumber: '4.5',
      ratingCount: '1000+ 5-Star Ratings',
      accuracyNumber: '97.5%',
      accuracyLabel: 'Accuracy',
      users: '5000+ Collectors',
    },
    backgroundImage: require('../../assets/images/splash-bg.png'),
    testimonials: [
      { name: 'Sarah M.', stars: 5, text: 'Identified a rare 1918 stamp worth $2,400. Absolutely incredible accuracy!' },
      { name: 'James K.', stars: 5, text: 'Best app for collectors. The AI valuation is spot-on every time.' },
      { name: 'Maria L.', stars: 5, text: 'Found out my grandmother\'s collection was worth over $15,000. Amazing!' },
      { name: 'David R.', stars: 5, text: 'Professional-grade identification in seconds. A must-have for any collector.' },
      { name: 'Emma W.', stars: 5, text: 'The portfolio tracking feature alone is worth the subscription. Love it!' },
    ],
    badgeLabel: 'Essential Reference Apps',
    tagline: 'Want to know how much\nyour stamps are worth?',
    ctaText: "Let's Go!",
    footerText: 'FREE FOR 7 DAYS, THEN $39.99/YEAR',
  },

  paywall: {
    showHeroImage: true,
    heroImage: require('../../assets/images/onboarding-bg.png'),
    pricingCardStyle: 'toggle',
    headline: 'Design Your Trial',
    subheadline: 'Get expert valuations for your entire collection',
    yearlyPrice: '$39.99',
    weeklyPrice: '$6.99',
    monthlyPrice: '$0.99',
    trialDays: 7,
    trialToggleLabels: [
      { label: 'Free', sublabel: '7 days' },
      { label: '1 month', sublabel: '$0.99' },
    ],
    yearlyPriceSubtext: 'FREE FOR 7 DAYS. THEN $39.99/YEAR',
    showReminderToggle: true,
    reminderToggleText: 'Remind me before the trial ends',
    footerLinks: ['Terms of Use', 'Privacy Policy', 'Subscription Terms', 'Restore'],
    features: [
      { text: 'Unlimited stamp scans', icon: 'camera' },
      { text: 'Detailed authenticity reports', icon: 'document-text' },
      { text: 'Portfolio tracking & analytics', icon: 'trending-up' },
      { text: 'PDF export for insurance', icon: 'download' },
      { text: 'Price history & trends', icon: 'bar-chart' },
    ],
    ctaText: 'Continue',
    skipText: 'Cancel',
  },

  home: {
    heroTitle: 'stampico',
    heroSubtitle: 'AI-Powered Stamp Identification & Valuation',
    heroImage: undefined, // require('../../assets/images/home-hero.png')
    primaryCtaText: 'Identify Stamp',
    secondaryCtaText: 'Grading',
    emptyState: {
      image: undefined, // require('../../assets/images/hero-item.png')
      title: "Know your item's true value",
      showGoldenRing: true,
    },
    promoBanner: {
      enabled: false,
      title: 'Special Offer',
      subtitle: 'for Banknotes',
      image: undefined,
    },
    cards: {
      itemOfDay: {
        enabled: true,
        title: 'Stamp of the Day',
        description: 'Discover rare and valuable stamps from around the world',
        image: undefined, // require('../../assets/images/stamp-of-day.png')
        placeholderValue: '80 cents',
        placeholderName: 'USA ¼ dollar, American Memorial Park',
      },
      expertPicks: {
        enabled: true,
        title: 'Expert Picks',
        description: 'Curated highlights from philately experts',
        image: undefined, // require('../../assets/images/expert-picks.png')
        items: [
          { id: '1', title: 'Expert Pick 1', image: undefined },
          { id: '2', title: 'Expert Pick 2', image: undefined },
          { id: '3', title: 'Expert Pick 3', image: undefined },
        ],
      },
      educational: {
        enabled: true,
        title: 'Guides',
        description: 'Master the art of stamp identification and grading',
        image: undefined, // require('../../assets/images/educational.png')
        items: [
          { id: '1', title: 'Stamp Regulations', image: undefined },
          { id: '2', title: 'Global Views on Stamps', image: undefined },
          { id: '3', title: 'Stamp Collecting', image: undefined },
        ],
      },
    },
  },

  snapTips: {
    enabled: true,
    title: 'Snap Tips',
    tips: [
      { text: 'Good lighting', icon: 'sunny' },
      { text: 'Flat surface', icon: 'layers' },
      { text: 'Clear focus', icon: 'eye' },
      { text: 'Full stamp visible', icon: 'scan' },
    ],
    goodExamples: [
      {
        type: 'good',
        image: require('../../assets/images/icon.png'), // Replace with tips-good-1.png
        caption: 'Excellent',
      },
    ],
    badExamples: [
      {
        type: 'bad',
        image: require('../../assets/images/icon.png'), // Replace with tips-bad-1.png
        caption: 'Too dark',
      },
      {
        type: 'bad',
        image: require('../../assets/images/icon.png'), // Replace with tips-bad-2.png
        caption: 'Multiple items',
      },
      {
        type: 'bad',
        image: require('../../assets/images/icon.png'), // Replace with tips-bad-3.png
        caption: 'Too blurry',
      },
    ],
    ctaText: 'Got It!',
  },

  loadingSteps: [
    'Analyzing perforations and edges...',
    'Checking watermarks...',
    'Searching auction databases...',
    'Calculating estimated value...',
  ],

  scanner: {
    instructionText: 'Position stamp within the frame',
    galleryButtonText: 'Choose from Gallery',
    analyzeButtonText: 'Analyze Stamp',
  },

  result: {
    currencySymbol: '$',
    labels: {
      name: 'Stamp Name',
      origin: 'Country',
      year: 'Year',
      estimatedValue: 'Estimated Value',
      confidence: 'Confidence',
      description: 'Analysis',
      addToCollection: 'Add to Collection',
    },
    upsellCta: {
      enabled: true,
      text: 'Get Precise Grade',
      subtitle: 'Get a pro grade & pricing effects',
      icon: 'ribbon',
    },
    showFeedback: true,
  },

  collection: {
    title: 'My Collection',
    totalValueLabel: 'Total Collection Value',
    totalItemsLabel: 'Total Items',
    showBestItems: true,
    showStatistics: true,
    showGeographicInsights: true,
    emptyStateText: 'No stamps in your collection yet',
    emptyStateSubtext: 'Scan your first stamp to get started',
    exportCollectionText: 'Export Collection Book',
    currencyLabel: 'Collection Value (USD)',
    tabs: [
      { key: 'summary', label: 'Summary' },
      { key: 'all', label: 'All' },
      { key: 'sets', label: 'Sets' },
    ],
    statsLabels: {
      itemCount: '{n} Items',
      issuerCount: '{n} Origins',
    },
    gradeOptions: ['Mint', 'AU', 'VF', 'F', 'VG', 'G', 'Fair', 'Poor', 'Uncertain'],
    filterOptions: ['Value', 'Date', 'Name', 'Origin'],
    sortOptions: ['Highest Value', 'Lowest Value', 'Newest', 'Oldest', 'A-Z'],
    spotlightLabels: {
      title: 'Your Best Items',
      mostValuable: 'Most Valuable',
      mostAncient: 'Most Ancient',
      rarest: 'Rarest',
    },
    geographicLabels: {
      title: 'Geographic Distribution',
      viewAll: 'View All',
      regionSummary: '{items} items distributed in {regions} regions',
    },
  },

  ai: {
    provider: 'gemini',
    model: 'gemini-2.5-flash',
    systemPrompt: `You are an expert philatelist and stamp appraiser. Analyze the stamp in the provided image and respond with ONLY valid JSON (no markdown, no code fences, no explanation) matching this exact structure:
{
  "name": "Full stamp name including series/issue",
  "origin": "Country of origin",
  "year": "Year of issue (string)",
  "estimatedValue": 0,
  "estimatedValueLow": 0,
  "estimatedValueHigh": 0,
  "confidence": 0,
  "rarity": "Common",
  "description": "Detailed analysis including condition, rarity, and notable features. Keep under 400 characters.",
  "extendedDetails": [
    {
      "title": "Section Title",
      "icon": "ionicon-name",
      "items": [{ "label": "Key", "value": "Value" }]
    }
  ]
}
Field notes:
- estimatedValue: best single estimate in USD (number, no currency symbol)
- estimatedValueLow / estimatedValueHigh: realistic market price range in USD
- confidence: integer 0-100
- rarity: one of "Very Common", "Common", "Uncommon", "Rare", "Very Rare", "Extremely Rare"
- description: concise, under 400 characters
- extendedDetails: array of 3-5 sections covering Physical Analysis (icon: "search"), Value Analysis (icon: "cash"), Historical Context (icon: "book"), Collector Info (icon: "people"), Authentication (icon: "shield-checkmark"). Each section should have 3-5 items.
- If you cannot identify the item or the image is unclear, set confidence to 0 and explain in description`,
    maxTokens: 4096,
    temperature: 0.3,
    responseSchema: {
      fields: ['name', 'origin', 'year', 'estimatedValue', 'confidence', 'description'],
    },
  },

  aso: {
    reviewThresholdValue: 10, // Trigger review if item value > $10
  },
};
