import { AppConfig } from '@/types';

/**
 * Single Source of Truth for all app content, theme, and configuration.
 *
 * VERTICAL: Vinyl Record Identification & Valuation (VinylCollect)
 *
 * To clone this app for a different vertical (coins, stamps, antiques, etc.):
 * 1. Update this config file with vertical-specific content
 * 2. Replace assets in /assets/images/
 * 3. Update app.json (name, slug, bundleIdentifier)
 *
 * NO hardcoded text, colors, or logic should exist in components!
 */

export const appConfig: AppConfig = {
  appName: 'VinylCollect',
  appSlug: 'vinylcollect',
  appDescription: 'AI-powered vinyl record identification and valuation',

  splash: {
    showGoldenGlow: true,
    autoTransitionMs: 2500,
    backgroundImage: require('../../assets/images/splash-bg.png'),
  },

  debugMode: false,

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

    // Accent colors — warm amber/orange for vinyl warmth
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
        title: 'Discover Hidden Gems',
        body: 'Found old records in a crate? Unlock their true market value instantly.',
        image: require('../../assets/images/icon.png'), // Replace with onboarding-1.png
      },
      {
        id: '2',
        title: 'Instant AI Valuation',
        body: 'Snap any vinyl and get expert-level identification and pricing in seconds.',
        image: require('../../assets/images/icon.png'), // Replace with onboarding-2.png
      },
      {
        id: '3',
        title: 'Build Your Collection',
        body: 'Track your record collection value and watch your library grow.',
        image: require('../../assets/images/icon.png'), // Replace with onboarding-3.png
      },
    ],
    stats: {
      show: true,
      ratingNumber: '',
      ratingCount: 'Identify & Value Records',
      accuracyNumber: '',
      accuracyLabel: 'AI-Powered Analysis',
      users: 'Growing Community',
    },
    backgroundImage: require('../../assets/images/splash-bg.png'),
    testimonials: [],
    badgeLabel: 'Essential Reference Apps',
    tagline: 'Want to know how much\nyour vinyl is worth?',
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
    showReminderToggle: false,
    reminderToggleText: 'Remind me before the trial ends',
    footerLinks: ['Terms of Use (EULA)', 'Privacy Policy', 'Restore'],
    features: [
      { text: 'Unlimited vinyl scans', icon: 'camera' },
      { text: 'Detailed pressing & label reports', icon: 'document-text' },
      { text: 'Collection tracking & analytics', icon: 'trending-up' },
      { text: 'PDF export for insurance', icon: 'download' },
      { text: 'Price history & market trends', icon: 'bar-chart' },
    ],
    ctaText: 'Continue',
    skipText: 'Cancel',
  },

  home: {
    heroTitle: 'VinylCollect',
    heroSubtitle: 'AI-Powered Vinyl Identification & Valuation',
    heroImage: undefined, // require('../../assets/images/home-hero.png')
    primaryCtaText: 'Identify Record',
    secondaryCtaText: 'Grading',
    showGradingButton: false,
    emptyState: {
      image: undefined, // require('../../assets/images/hero-item.png')
      title: "Know your record's true value",
      showGoldenRing: true,
    },
    promoBanner: {
      enabled: false,
      title: 'Special Offer',
      subtitle: 'for CD Collections',
      image: undefined,
    },
    cards: {
      itemOfDay: {
        enabled: true,
        title: 'Record of the Day',
        description: 'Discover rare and valuable vinyl from around the world',
        image: undefined, // require('../../assets/images/record-of-day.png')
        placeholderValue: '$450',
        placeholderName: 'Pink Floyd — The Dark Side of the Moon (1st UK pressing)',
      },
      expertPicks: {
        enabled: true,
        title: 'Expert Picks',
        description: 'Curated highlights from vinyl experts',
        image: undefined,
        items: [
          { id: '1', title: 'Rare First Pressings', image: undefined },
          { id: '2', title: 'Jazz Essentials', image: undefined },
          { id: '3', title: 'Punk & New Wave', image: undefined },
        ],
      },
      educational: {
        enabled: true,
        title: 'Guides',
        description: 'Master the art of vinyl grading and identification',
        image: undefined,
        items: [
          { id: '1', title: 'Vinyl Grading 101', image: undefined },
          { id: '2', title: 'Identifying Pressings', image: undefined },
          { id: '3', title: 'Building a Collection', image: undefined },
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
      { text: 'Full cover visible', icon: 'scan' },
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
        caption: 'Multiple records',
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
    'Reading label and catalog number...',
    'Identifying pressing and variant...',
    'Searching Discogs & auction databases...',
    'Calculating estimated value...',
  ],

  scanner: {
    instructionText: 'Position record cover within the frame',
    galleryButtonText: 'Choose from Gallery',
    analyzeButtonText: 'Analyze Record',
    frontCoverButtonText: 'Scan Front Cover',
    backCoverButtonText: 'Scan Back Cover',
    labelButtonText: 'Scan Center Label (Optional)',
    runAnalysisButtonText: 'Run Analysis',
  },

  result: {
    currencySymbol: '$',
    labels: {
      name: 'Record Title',
      origin: 'Label / Country',
      year: 'Year',
      estimatedValue: 'Estimated Value',
      confidence: 'Confidence',
      description: 'Analysis',
      addToCollection: 'Add to Collection',
    },
    upsellCta: {
      enabled: true,
      text: 'Get Precise Grade',
      subtitle: 'Get a pro grade & pressing details',
      icon: 'ribbon',
    },
    showFeedback: true,
    forceSaveText: 'Save Manually',
  },

  collection: {
    title: 'My Collection',
    totalValueLabel: 'Total Collection Value',
    totalItemsLabel: 'Total Records',
    showBestItems: true,
    showStatistics: true,
    showGeographicInsights: true,
    emptyStateText: 'No records in your collection yet',
    emptyStateSubtext: 'Scan your first vinyl to get started',
    exportCollectionText: 'Export Collection Book',
    exportDataText: 'Export Data',
    currencyLabel: 'Collection Value (USD)',
    tabs: [
      { key: 'summary', label: 'Summary' },
      { key: 'all', label: 'All' },
      { key: 'sets', label: 'Sets' },
    ],
    statsLabels: {
      itemCount: '{n} Records',
      issuerCount: '{n} Labels',
    },
    gradeOptions: ['Mint (M)', 'Near Mint (NM)', 'Very Good Plus (VG+)', 'Very Good (VG)', 'Good Plus (G+)', 'Good (G)', 'Fair (F)', 'Poor (P)'],
    filterOptions: ['Value', 'Date', 'Name', 'Label'],
    sortOptions: ['Highest Value', 'Lowest Value', 'Newest', 'Oldest', 'Recently Collected', 'Earliest Collected', 'A-Z'],
    spotlightLabels: {
      title: 'Your Best Records',
      mostValuable: 'Most Valuable',
      mostAncient: 'Oldest Pressing',
      rarest: 'Rarest',
    },
    geographicLabels: {
      title: 'Geographic Distribution',
      viewAll: 'View All',
      regionSummary: '{items} records distributed across {regions} labels',
    },
  },

  // NOTE: API keys referenced via EXPO_PUBLIC_* are bundled client-side.
  // For production, Gemini and Discogs keys should ideally be proxied through
  // a backend. Acceptable for MVP as they are rate-limited API keys, not secrets
  // that grant account-level access.
  ai: {
    provider: 'gemini',
    model: 'gemini-2.5-flash',
    systemPrompt: `You are an expert vinyl record appraiser and music historian. Analyze the provided information about a vinyl record. If images are provided (front cover, back cover, and optional center label), look for catalog numbers, barcodes, matrix/runout numbers, or label variations to determine the exact pressing. Respond with ONLY valid JSON (no markdown, no code fences, no explanation) matching this exact structure:
{
  "artist": "Artist or band name",
  "albumName": "Album title",
  "pressingName": "Pressing/edition details if identifiable (e.g. '1977 UK Pressing', 'Original US Mono'). Empty string if unknown.",
  "origin": "ISO 3166-1 alpha-3 country code of release (e.g. USA, GBR, DEU, FRA, JPN, CHN)",
  "year": "Year of this pressing/release (string)",
  "estimatedValue": 0,
  "estimatedValueLow": 0,
  "estimatedValueHigh": 0,
  "confidence": 0,
  "rarity": "Common",
  "label": "Record label name WITHOUT the word 'Records' at the end (e.g. Columbia, Blue Note, Motown, Atlantic, Parlophone)",
  "genre": "Primary music genre",
  "condition": "Vinyl condition grade: Mint (M), Near Mint (NM), Very Good Plus (VG+), Very Good (VG), Good Plus (G+), Good (G), Fair (F), Poor (P)",
  "originalReleaseDate": "YYYY-MM-DD when this album was FIRST released worldwide (not this pressing's date). e.g. '1973-03-01' for Dark Side of the Moon.",
  "albumArtQuery": "A highly specific search query for scraping the official album cover art (e.g. 'Pink Floyd - The Dark Side of the Moon - 1973')",
  "description": "Detailed analysis including pressing info, condition notes, label details, and notable features. Keep under 400 characters.",
  "extendedDetails": [
    {
      "title": "Section Title",
      "icon": "ionicon-name",
      "items": [{ "label": "Key", "value": "Value" }]
    }
  ]
}
Field notes:
- estimatedValue: best single estimate in USD for this pressing in VG+ condition (number, no currency symbol)
- estimatedValueLow / estimatedValueHigh: realistic market price range in USD
- confidence: integer 0-100
- rarity: one of "Very Common", "Common", "Uncommon", "Rare", "Very Rare", "Extremely Rare"
- genre: one of "Blues", "Rock", "Pop", "Jazz", "Funk", "Soul", "Electronic", "Classical", "Hip Hop", "R&B", "World", "Country", "Folk", "Metal", "Latin", "Reggae", "Non-Music", "Stage & Screen"
- description: concise, under 400 characters. Do NOT mention condition uncertainty or lack of photos - focus on what you can identify.
- condition: Assess using the Goldmine Grading Standard. If cover images are provided, evaluate cover condition (ring wear, seam splits, creasing, writing) and default the vinyl itself to "Very Good Plus (VG+)" as a conservative estimate (since vinyl condition cannot be assessed from photos alone). Downgrade if the cover shows significant damage: heavy ring wear, seam splits, writing = "Very Good (VG)"; major tears, water damage, tape repairs = "Good (G)" or lower. If no images provided, use "Uncertain".
- originalReleaseDate: YYYY-MM-DD for the album's original worldwide release. Not this pressing's year.
- extendedDetails: array of 3-5 sections covering Record Details (icon: "disc", items: format, speed, label, catalog number, matrix/runout), Value Analysis (icon: "cash", items: median sale, price trend, pressing premium), Pressing Info (icon: "search", items: pressing plant, country, variant notes, special features), Historical Context (icon: "book", items: chart positions, cultural significance, production notes), Collector Info (icon: "people", items: demand level, completist notes, related releases). Each section should have 3-5 items.
- If you cannot identify the record or the image is unclear, set confidence to 0 and explain in description WITHOUT mentioning lack of photos`,
    maxTokens: 4096,
    temperature: 0.3,
    responseSchema: {
      fields: ['artist', 'albumName', 'pressingName', 'origin', 'year', 'estimatedValue', 'confidence', 'description'],
    },
  },

  legal: {
    privacyPolicyUrl: 'https://bigdaddyrus.github.io/vinyl-identify-collect/privacy-policy.html',
    termsUrl: 'https://bigdaddyrus.github.io/vinyl-identify-collect/terms-of-service.html',
  },

  aso: {
    reviewThresholdValue: 10, // Trigger review if item value > $10
  },
};
