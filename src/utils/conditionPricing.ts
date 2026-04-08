/**
 * Goldmine-aligned condition pricing multipliers.
 *
 * The AI always prices at VG+ (≈60% of Near Mint). These multipliers are
 * relative to that VG+ baseline so we can adjust the displayed price when
 * the user changes the condition grade.
 *
 * Source: goldminemag.com/collector-resources/record-grading-101
 */

export interface GradingInfoEntry {
  grade: string;
  abbrev: string;
  multiplier: number;
  goldminePercent: string;
  vinylDesc: string;
  sleeveDesc: string;
}

// Multipliers relative to VG+ (AI baseline = 1.0)
const CONDITION_MULTIPLIERS: Record<string, number> = {
  'Mint (M)': 3.00,
  'Near Mint (NM)': 1.60,
  'Very Good Plus (VG+)': 1.00,
  'Very Good (VG)': 0.50,
  'Good Plus (G+)': 0.25,
  'Good (G)': 0.15,
  'Fair (F)': 0.05,
  'Poor (P)': 0.02,
};

// Spread (±%) for the low/high range at each condition
const CONDITION_SPREAD: Record<string, number> = {
  'Mint (M)': 0.10,
  'Near Mint (NM)': 0.12,
  'Very Good Plus (VG+)': 0.15,
  'Very Good (VG)': 0.20,
  'Good Plus (G+)': 0.25,
  'Good (G)': 0.30,
  'Fair (F)': 0.35,
  'Poor (P)': 0.40,
};

const UNCERTAIN_SPREAD = 0.50;

export function applyConditionPricing(
  baseValue: number,
  condition: string,
): {
  estimatedValue: number;
  estimatedValueLow: number;
  estimatedValueHigh: number;
} {
  const multiplier = CONDITION_MULTIPLIERS[condition] ?? 1.0;
  const spread = CONDITION_SPREAD[condition] ?? UNCERTAIN_SPREAD;

  const estimatedValue = Math.round(baseValue * multiplier * 100) / 100;
  const estimatedValueLow = Math.round(estimatedValue * (1 - spread) * 100) / 100;
  const estimatedValueHigh = Math.round(estimatedValue * (1 + spread) * 100) / 100;

  return { estimatedValue, estimatedValueLow, estimatedValueHigh };
}

/**
 * Goldmine grading reference data for the in-app guide screen.
 */
export const GRADING_INFO: GradingInfoEntry[] = [
  {
    grade: 'Mint (M)',
    abbrev: 'M',
    multiplier: 3.00,
    goldminePercent: '150-250%',
    vinylDesc:
      'Absolutely perfect. No marks, fingerprints, or surface noise. Factory-fresh.',
    sleeveDesc:
      'Perfect. No ring wear, seam splits, creases, writing, stickers, or fading.',
  },
  {
    grade: 'Near Mint (NM)',
    abbrev: 'NM',
    multiplier: 1.60,
    goldminePercent: '100%',
    vinylDesc:
      'May have a tiny trace of handling \u2014 faint marks visible only under direct light. No audible defects.',
    sleeveDesc:
      'Barely perceptible signs of handling. No creases, tears, or splits.',
  },
  {
    grade: 'Very Good Plus (VG+)',
    abbrev: 'VG+',
    multiplier: 1.00,
    goldminePercent: '55-70%',
    vinylDesc:
      'Light surface marks; occasional faint noise in quiet passages. No deep scratches, skips, or warps.',
    sleeveDesc:
      'Light ring wear, minor edge wear, perhaps a small crease. No splits or writing.',
  },
  {
    grade: 'Very Good (VG)',
    abbrev: 'VG',
    multiplier: 0.50,
    goldminePercent: '25-35%',
    vinylDesc:
      'Surface noise throughout playback. Light scratches visible without angling. Plays without skipping.',
    sleeveDesc:
      'Obvious ring wear, minor seam splits (<3 cm), spine creasing, possibly light writing.',
  },
  {
    grade: 'Good Plus (G+)',
    abbrev: 'G+',
    multiplier: 0.25,
    goldminePercent: '10-20%',
    vinylDesc:
      'Scratches clearly visible. Consistent surface noise. Some distortion on louder passages.',
    sleeveDesc:
      'Seam splits, creasing, writing, sticker damage, tape repairs.',
  },
  {
    grade: 'Good (G)',
    abbrev: 'G',
    multiplier: 0.15,
    goldminePercent: '5-15%',
    vinylDesc:
      'Deep scratches, heavy surface noise, groove wear audible as distortion.',
    sleeveDesc:
      'Heavy damage \u2014 major seam splits, water stains, large tears, heavy writing.',
  },
  {
    grade: 'Fair (F)',
    abbrev: 'F',
    multiplier: 0.05,
    goldminePercent: '2-5%',
    vinylDesc:
      'Deep gouges, heavy warping, extreme noise. May skip in multiple places.',
    sleeveDesc:
      'May be partially missing, heavily water-damaged, or held together with tape.',
  },
  {
    grade: 'Poor (P)',
    abbrev: 'P',
    multiplier: 0.02,
    goldminePercent: '~0%',
    vinylDesc:
      'Cracked, deeply gouged, heavily warped, or beyond practical use.',
    sleeveDesc: 'Missing, destroyed, or no longer functional.',
  },
];
