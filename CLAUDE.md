# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **reusable React Native (Expo) template** for Vision-AI identifier apps. It's designed as a configurable platform that can be cloned and adapted to any vertical market (stamps, coins, vinyl records, antiques, etc.) by simply changing the configuration file and assets.

**Current Implementation:** Vinyl record identification and valuation app (VinylSnap), forked from the StampSnap template.

## Commands

### Development
```bash
# Start development server
npm start

# Run on specific platform
npm run ios
npm run android
npm run web

# Lint code
npm run lint

# Reset project (clears cache and reinstalls dependencies)
npm run reset-project
```

### Testing the App Flow
```bash
# Start the app and test the complete user journey:
# 1. Splash (auto-transitions) → Onboarding (social proof) → Paywall → Scanner tab
# 2. Click "Analyze Stamp" → Loading animation → Result (or Not Found if confidence=0)
# 3. "Add to Collection" → Portfolio tab (shows total value)
# 4. Kebab menu → Edit item / Share image / Delete
# 5. "Export PDF" → generates and shares PDF report

# To reset onboarding/paywall state for testing:
# Clear AsyncStorage or modify useAppStore to trigger resetApp()
```

## Architecture

### Configuration-Driven Design

**Core Principle:** Zero hardcoded vertical-specific content. All text, colors, pricing, and AI prompts live in `src/config/appConfig.ts`.

**To clone this app for a new vertical:**
1. Modify `src/config/appConfig.ts` (change appName, theme colors, text, prompts)
2. Replace assets in `/assets/images/`
3. Update `app.json` (name, slug, bundleIdentifier, package)
4. No code changes required in components!

### State Management

- **Zustand** with AsyncStorage persistence (no Provider needed)
- **Store location:** `src/store/useAppStore.ts`
- **Key state:** onboarding completion, paywall seen, collection items, scan count, review trigger
- **Hydration:** Root layout waits for store hydration before rendering (prevents flash)

### Navigation Structure

```
app/
├── _layout.tsx                    # Root Stack (splash, onboarding, paywall, tabs)
├── splash.tsx                     # Auto-transition splash with config bg image
├── onboarding.tsx                 # Social proof: reviews, laurel stats, CTA
├── paywall.tsx                    # Hard paywall with config hero image
└── (tabs)/
    ├── _layout.tsx                # Tab navigator with redirect guards
    ├── (home)/
    │   └── index.tsx              # Home dashboard with collection summary
    ├── (scanner)/
    │   ├── _layout.tsx            # Scanner Stack
    │   ├── index.tsx              # Camera placeholder + crop overlay
    │   ├── loading.tsx            # "Illusion of Labor" animated steps
    │   ├── result.tsx             # Analysis result + kebab menu (edit/share/delete)
    │   ├── edit.tsx               # Collection item edit modal
    │   ├── share.tsx              # Shareable image card modal
    │   └── notfound.tsx           # Not-found screen (confidence=0)
    └── portfolio.tsx              # Collection with financial dashboard
```

**Redirect Guards:** In `(tabs)/_layout.tsx`, checks if onboarding/paywall completed. Uses `<Redirect>` to enforce flow.

**Prevent Back Navigation:**
- `loading.tsx` → `result.tsx` uses `router.replace()` to prevent back-swipe to loading
- Loading screen has `gestureEnabled: false`

### "Illusion of Labor" Loading Pattern

**Purpose:** Create perceived value by forcing a 4-5 second delay even if API responds instantly.

**Implementation:**
- `setTimeout` sequences through 4 steps (1s each)
- Reanimated handles UI animations (spinner rotation, checkmark pop)
- Heavy haptic on completion before navigation

### Conversion Optimization Integrations

**Haptic Feedback:**
- Price reveal: `impactAsync('heavy')` when loading completes
- Add to collection: `notificationAsync('success')`
- Button taps: `impactAsync('light')`

**StoreReview Trigger (ASO):**
- **Never** on app open
- Triggers when user adds first item with `value > $10` to collection
- Uses `hasTriggeredReview` flag to fire only once
- 1.5s delay after success haptic for optimal UX timing

**Serif Typography for Prices:**
- Uses `PlayfairDisplay_700Bold` (cross-platform)
- Georgia is iOS-only, so we use Google Fonts
- Font loading in root layout with `useFonts()` hook

### Config-Driven Images & Assets

All screen images are set via `appConfig` for easy template swapping:
- `splash.backgroundImage` — splash screen background
- `onboarding.backgroundImage` — onboarding social proof screen background
- `paywall.heroImage` — paywall hero section image
- `home.emptyState.image`, `home.cards.itemOfDay.image` — home screen assets

### Country Origin Normalization

`src/data/countryCoordinates.ts` normalizes AI-returned country names (e.g., "US", "USA", "United States" → "United States") via an alias map. Applied at scan time in `geminiVision.ts` and in store getters for geographic distribution.

## File Organization

```
src/
├── config/
│   └── appConfig.ts          # Single source of truth (CRITICAL)
├── types/
│   └── index.ts              # TypeScript interfaces
├── theme/
│   └── index.ts              # Derived theme values from config
├── store/
│   └── useAppStore.ts        # Zustand + AsyncStorage persistence
├── data/
│   └── countryCoordinates.ts # Country alias normalization + lat/lng lookup
├── services/
│   └── geminiVision.ts       # Gemini Vision API integration
├── utils/
│   ├── haptics.ts            # Platform-safe haptic wrappers
│   ├── pdf.ts                # expo-print PDF generation
│   └── rarity.ts             # Rarity score helper
├── mock/
│   └── analysisData.ts       # Mock stamp analysis results
└── components/
    ├── GradientButton.tsx    # Gold gradient CTA button
    ├── GoldenGlow.tsx        # Ambient gold gradient overlay
    ├── HomeHero.tsx          # Home screen hero section
    ├── HorizontalCarousel.tsx # Scrolling card carousel
    ├── LoadingStepItem.tsx   # Reanimated step animation
    ├── CollectionHeader.tsx  # Portfolio value + stats header
    └── ProBadge.tsx          # Premium badge component
```

## Key Technical Decisions

| Decision | Rationale |
|----------|-----------|
| `@/` path alias → `./src/*` | Clean imports, easy refactoring |
| Zustand over Context | No Provider wrapper, direct hook access, better TypeScript |
| Playfair Display font | Cross-platform serif for financial professionalism |
| Reanimated for loading | 60fps animations on UI thread |
| expo-print for PDF | Native PDF generation without WebView |
| LinearGradient in paywall | Premium visual hierarchy |
| Redirect guards in tabs layout | Root layout must declare all screens upfront |

## Common Tasks

### Add New Onboarding Slide
1. Add slide object to `appConfig.onboarding.slides[]`
2. Replace `image: require()` path with new asset
3. No component changes needed

### Change App Vertical (e.g., Coins)
1. `appConfig.ts`: Change `appName`, `appSlug`, `theme.primaryColor`, all text
2. `appConfig.ts`: Update `splash.backgroundImage`, `onboarding.backgroundImage`, `paywall.heroImage`
3. `appConfig.ts`: Update `onboarding.testimonials`, `tagline`, `stats`, `ai.systemPrompt`
4. `app.json`: Update `name`, `slug`, `bundleIdentifier`, `package`
5. Replace images in `/assets/images/` (splash-bg, onboarding-bg, etc.)
6. Update mock data in `analysisData.ts` with vertical-specific examples

### Add New Loading Step
1. Add string to `appConfig.loadingSteps[]` (currently 4 steps)
2. Update `spec.md` if duration changes
3. Loading screen auto-sequences through all steps

### Modify Paywall Pricing
1. Update `appConfig.paywall.yearlyPrice`, `weeklyPrice`, `trialDays`
2. Add/remove features in `paywall.features[]`
3. No component code changes

## Troubleshooting

### "Module not found: @/..." error
- Check `tsconfig.json` has `"@/*": ["./src/*"]` in `paths`
- Restart TypeScript server in IDE
- Run `npm start -- --clear` to clear Metro cache

### Onboarding/Paywall loops or doesn't appear
- Check AsyncStorage persistence: look for `vinylsnap-storage` key
- Verify redirect guards in `(tabs)/_layout.tsx`
- Use `useAppStore.getState().resetApp()` in console to reset state

### Fonts not loading (white squares for prices)
- Ensure `PlayfairDisplay_700Bold` imported in `app/_layout.tsx`
- Root layout waits for `fontsLoaded && storeHydrated` before rendering
- Check `SplashScreen.hideAsync()` is called in `useEffect`

### Loading screen navigation broken
- `loading.tsx` should use `router.replace()` not `router.push()`
- Ensure `gestureEnabled: false` in loading screen options
- Pass `resultData` as JSON string in params

## RevenueCat Integration (Future)

When adding real subscriptions:
1. Install: `npx expo install react-native-purchases`
2. Configure RevenueCat API keys in `app.config.ts`
3. Replace `seePaywall()` in `paywall.tsx` with `Purchases.purchasePackage()`
4. Add entitlement checks before premium features (PDF export, unlimited scans)

## AI API Integration

Gemini Vision API is integrated in `src/services/geminiVision.ts`:
- Set `EXPO_PUBLIC_GEMINI_API_KEY` in `.env.local`
- Model, prompt, and response schema configured in `appConfig.ai`
- Reads image as base64 via `expo-file-system/legacy` (SDK 54+)
- Returns `AnalysisResult` with generated ID and timestamp
- If confidence=0, loading screen routes to not-found screen

## Important Notes

- **Never hardcode text/colors/images in components** — always reference `appConfig` or `theme`
- **expo-file-system v2 (SDK 54+):** Use `expo-file-system/legacy` for `readAsStringAsync`/`EncodingType`
- **PDF export** currently text-only; images require base64 encoding
- **Camera view** is placeholder (dark View); real camera needs `expo-camera` permission
- **Haptics** fail silently on unsupported platforms (web, some Android)
- **StoreReview** only works in production builds on iOS/Android
- **Collection editing:** Items can be edited (name, value, year, grade, notes) via edit modal accessible from result screen and portfolio kebab menus
- **Sharing:** `react-native-view-shot` captures a styled card as PNG for sharing via `expo-sharing`
