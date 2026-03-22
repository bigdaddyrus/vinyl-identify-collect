# VinylCollect

AI-powered vinyl record identification and valuation app built with React Native (Expo).

Snap a photo of any vinyl record and get instant identification, pressing details, and market valuation powered by Gemini Vision AI.

## Features

- **AI Record Identification** — Snap front cover, back cover, and center label for expert-level analysis using Gemini Vision
- **Market Valuation** — Get estimated value, price range, and rarity assessment
- **Collection Management** — Track your entire vinyl library with total portfolio value
- **Multi-Image Scanning** — Capture front, back, and label in a single scan session with interactive crop tool
- **Geographic Insights** — See your collection's origin distribution on a world map
- **Export Options** — Export collection as JSON (with Discogs query), image ZIP, or PDF report
- **Offline-First** — Full local storage with optional Supabase cloud sync
- **Search & Sort** — Find records by name, sort by value, date, or alphabetically
- **Duplicate Detection** — Warns when a scanned record may already exist in your collection

## Getting Started

### Prerequisites

- Node.js 18+
- Expo CLI (`npx expo`)
- iOS Simulator or Android Emulator (or physical device)

### Installation

```bash
npm install
```

### Environment Variables

Create a `.env.local` file:

```
EXPO_PUBLIC_GEMINI_API_KEY=your_gemini_api_key
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Run

```bash
npx expo start
```

## Tech Stack

- **Framework**: React Native with Expo SDK 54
- **Navigation**: Expo Router (file-based)
- **State**: Zustand with AsyncStorage persistence
- **AI**: Google Gemini Vision API
- **Backend**: Supabase (auth, sync)
- **Styling**: Config-driven theme system

## Project Structure

```
app/                     # File-based routes (Expo Router)
  (tabs)/                # Tab navigator
    (home)/              # Home dashboard
    (scanner)/           # Camera, crop, loading, result, edit
    portfolio.tsx        # Collection with summary, list, sets tabs
src/
  config/appConfig.ts    # Single source of truth for all text, colors, AI prompts
  types/index.ts         # TypeScript interfaces
  store/useAppStore.ts   # Zustand store
  services/              # Gemini Vision, Supabase auth, migration
  components/            # Reusable UI components
  utils/                 # Haptics, PDF export, rarity helpers
  data/                  # Country coordinates & ISO normalization
```

## Configuration

All app content, colors, and behavior is driven by `src/config/appConfig.ts`. To adapt this template for a different collectible vertical (coins, stamps, antiques), update the config and assets — no component code changes needed.
