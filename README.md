# VinylCollect

AI-powered vinyl record identification and valuation app built with React Native (Expo).

Scan a barcode or snap photos of your records. The app uses a hybrid **Discogs + Gemini Vision** pipeline to identify pressings, assess condition, estimate market value, and suggest food/drink/vibe pairings.

## Features

- **Hybrid Barcode + AI Identification** — Scan EAN/UPC barcode for Discogs lookup, then enrich with Gemini Vision analysis of front cover, back cover, and center label
- **Market Valuation** — Get estimated value, price range, and rarity assessment
- **Collection Management** — Track your entire vinyl library with total portfolio value
- **Sets** — Playlist-like grouping: create named sets, assign items from edit/result/set detail screens
- **Bulk Actions** — Select multiple items to delete, move to set, or export (PDF/JSON/ZIP)
- **Multi-Image Scanning** — Capture front, back, and label in a single scan session with interactive crop tool
- **Geographic Insights** — See your collection's origin distribution on a world map
- **Export Options** — Export collection as JSON (with Discogs query), image ZIP, or styled PDF report
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
EXPO_PUBLIC_DISCOGS_KEY=your_discogs_consumer_key
EXPO_PUBLIC_DISCOGS_SECRET=your_discogs_consumer_secret
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Restart Metro with `--clear` after adding env vars.

### Run

```bash
npx expo start
npm run ios       # Run on iOS simulator
npm run android   # Run on Android emulator
```

## Architecture

### Config-Driven Design

All text, colors, pricing, and AI prompts live in `src/config/appConfig.ts`. Components never hardcode vertical-specific content. To adapt this template for a different collectible vertical (coins, stamps, antiques), update the config and assets -- no component code changes needed.

### Navigation Structure

```
app/
├── _layout.tsx                    # Root Stack (splash, onboarding, paywall, tabs)
├── splash.tsx                     # Auto-transition splash
├── onboarding.tsx                 # Social proof + CTA
├── paywall.tsx                    # Hard paywall
├── map.tsx                        # Full-screen origin map
└── (tabs)/
    ├── _layout.tsx                # Tab navigator with redirect guards
    ├── (home)/
    │   └── index.tsx              # Home dashboard
    ├── (scanner)/
    │   ├── _layout.tsx            # Scanner Stack + ScanCartProvider
    │   ├── index.tsx              # Camera + barcode scanner
    │   ├── crop.tsx               # Image crop overlay
    │   ├── tips.tsx               # Scanning tips modal
    │   ├── loading.tsx            # "Illusion of Labor" + API orchestration
    │   ├── result.tsx             # Analysis result + kebab menu
    │   ├── edit.tsx               # Edit item modal
    │   ├── share.tsx              # Shareable image card modal
    │   ├── notfound.tsx           # Not-found screen (confidence=0)
    │   └── setdetail.tsx          # Set detail view
    └── portfolio.tsx              # Collection with Summary/All/Sets tabs
```

### State Management

- **Zustand** with AsyncStorage persistence (`src/store/useAppStore.ts`)
- **ScanCartContext** (`src/context/ScanCartContext.tsx`) -- ephemeral scan session state (images, barcode, current step)
- Root layout waits for store hydration before rendering

## Hybrid Discogs + Gemini Pipeline

The scanner uses a two-stage pipeline that combines structured database lookups with AI vision analysis.

### Flow

```
┌──────────┐     ┌──────────┐     ┌──────────────┐     ┌────────┐
│ Barcode  │────>│ Discogs  │────>│ Gemini Vision│────>│ Result │
│ Scanner  │     │ API      │     │ (enriched)   │     │        │
└──────────┘     └──────────┘     └──────────────┘     └────────┘
                      │ fail/skip
                      v
               ┌──────────────┐
               │ Gemini Vision│
               │ (visual-only)│
               └──────────────┘
```

### Scenario A: Barcode Found

1. Camera scans EAN/UPC barcode (`expo-camera` barcode detection)
2. `searchByBarcode()` in `src/services/discogs.ts` queries the Discogs API:
   - `GET /database/search?barcode=...&type=release` to find the release ID
   - `GET /releases/{id}` to fetch full metadata (artist, title, year, label, genre, country, tracklist, catalog number, formats)
3. `buildDiscogsEnrichedPrompt()` in `src/services/geminiVision.ts` prepends Discogs metadata to the base AI prompt
4. Gemini receives the enriched prompt + all captured images (front, back, label as base64)
5. Gemini uses Discogs data as ground truth and focuses on condition grading, value estimation, and pairings

### Scenario B: No Barcode

1. User skips barcode step or no barcode detected
2. `addPairingsToPrompt()` uses the base system prompt with pairing instructions only
3. Gemini identifies the record purely from the images

### Key Design Decisions

- Discogs failure is **non-blocking** -- if the API is down or no match is found, the pipeline falls through to visual-only analysis
- The barcode is preserved in `ScanCartContext` across all scan steps (front/back/label image captures)
- Auth uses the `Authorization` header only (never query string) to prevent token leakage
- 10-second timeout on Discogs calls, 30-second timeout on Gemini calls
- AI responses are validated with Zod (`src/services/analysisSchema.ts`) with graceful defaults for partial/malformed responses

## Sets (Collection Grouping)

Sets are playlist-like groups for organizing vinyl records. Items can belong to multiple sets.

### Data Model

```typescript
interface CollectionSet {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
}

// Items reference sets via:
interface AnalysisResult {
  setIds?: string[];
  // ...other fields
}
```

### Store Actions

| Action | Description |
|--------|-------------|
| `createSet(name)` | Create a new set |
| `renameSet(id, name)` | Rename an existing set |
| `deleteSet(id)` | Delete set and clean `setIds` from all items |
| `addItemToSet(itemId, setId)` | Add item to a set |
| `removeItemFromSet(itemId, setId)` | Remove item from a set |
| `getItemsInSet(setId)` | Get all items in a set |
| `getSetValue(setId)` | Sum of estimated values for items in a set |

### Components

| Component | Purpose |
|-----------|---------|
| `SetPickerModal` | Shared bottom-sheet for selecting/creating sets (used by edit + result screens) |
| `AddToSetModal` | Bottom-sheet for adding collection items to a specific set with search and confirm (used by set detail) |
| `BulkMoveModal` | Bottom-sheet "Move to..." picker for bulk moving selected items |

### Entry Points

- **Edit screen** -- "Custom Set" field opens `SetPickerModal`
- **Result screen** -- "Add to Set" in kebab menu opens `SetPickerModal`
- **Portfolio Sets tab** -- create/rename/delete sets, tap to view set detail
- **Set detail screen** -- "+" button opens `AddToSetModal` with search and confirm

## Bulk Actions

Long-press an item or tap the "Select" button on the portfolio All tab to enter selection mode.

### Selection Mode

- Tab bar hides during selection (via `useNavigation().getParent()?.setOptions()`)
- "Select All (N)" header with checkbox + "Cancel" button replaces the search/sort bar
- Orange checkboxes appear on each item

### Actions

| Action | Behavior |
|--------|----------|
| **Delete** | Confirmation alert, removes all selected items from collection |
| **Move** | Opens `BulkMoveModal` to move items to an existing or new set |
| **Export** | Format picker: PDF, JSON, or Images (ZIP) |

### Export Functions

| Function | File | Output |
|----------|------|--------|
| `exportCollectionToPDF` | `src/utils/pdf.ts` | Styled PDF with images, values, descriptions |
| `exportCollectionAsJSON` | `src/utils/exportCollection.ts` | JSON with full item metadata + `discogsQuery` |
| `exportImageAssetsZip` | `src/utils/exportCollection.ts` | ZIP of all item images organized by ID |

## Navigation

### Back Navigation

Result and set detail screens use source-aware back navigation to return to the correct screen and tab:

- Portfolio passes `source: portfolio-{activeTab}` when opening items
- Set detail passes `source: setdetail:{setId}` when opening items
- Result screen reads `source` param and uses `router.navigate()` instead of `router.back()` to preserve tab state

### Tab Bar Visibility

The scanner layout hides the tab bar on `loading`, `result`, and `notfound` screens. The portfolio screen hides it during bulk selection mode. Both use `navigation.setOptions({ tabBarStyle })`.

## File Organization

```
src/
├── config/appConfig.ts          # Single source of truth
├── types/index.ts               # TypeScript interfaces
├── theme/index.ts               # Derived theme values
├── store/useAppStore.ts         # Zustand + AsyncStorage persistence
├── context/ScanCartContext.tsx   # Scan session state (images, barcode, step)
├── services/
│   ├── discogs.ts               # Discogs barcode lookup
│   ├── geminiVision.ts          # Gemini Vision API + prompt building
│   └── analysisSchema.ts        # Zod schema for AI response validation
├── data/countryCoordinates.ts   # ISO 3166-1 alpha-3 normalization + lat/lng
├── utils/
│   ├── pdf.ts                   # PDF export
│   ├── exportCollection.ts      # JSON + ZIP image export
│   ├── haptics.ts               # Platform-safe haptic wrappers
│   └── rarity.ts                # Rarity score helper
└── components/
    ├── SetPickerModal.tsx        # Set selection bottom-sheet
    ├── AddToSetModal.tsx         # Add items to set bottom-sheet
    ├── BulkMoveModal.tsx         # Bulk move bottom-sheet
    ├── CollectionCard.tsx        # Item row (image + name + metadata)
    ├── CollectionHeader.tsx      # Portfolio value + stats header
    ├── SpotlightCarousel.tsx     # Most valuable / ancient / rarest carousel
    ├── WorldMapPreview.tsx       # Geographic distribution mini-map
    ├── GradientButton.tsx        # Gold gradient CTA button
    ├── GoldenGlow.tsx            # Ambient gold gradient overlay
    └── PillTabSwitcher.tsx       # Summary / All / Sets tab pills
```

## Tech Stack

| Technology | Purpose |
|------------|---------|
| React Native + Expo SDK 54 | Cross-platform mobile framework |
| Expo Router | File-based navigation |
| Zustand | State management (no Provider wrapper) |
| Google Gemini Vision | AI image analysis |
| Discogs API | Barcode-based record identification |
| Supabase | Auth + cloud sync (optional) |
| Reanimated | 60fps UI thread animations |
| expo-camera | Barcode scanning + photo capture |
| jszip | Client-side ZIP generation |
| Zod | AI response validation with defaults |
| Playfair Display | Cross-platform serif font for prices |
| expo-print | PDF generation |
