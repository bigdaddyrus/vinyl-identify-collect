/**
 * ISO 3166-1 alpha-3 based country lookup for map markers, origin normalization,
 * and display name resolution.
 *
 * Architecture:
 * - ISO_COUNTRIES: master record keyed by alpha-3 code
 * - NAME_TO_ISO: alias map (lowercase) → alpha-3 code
 * - normalizeOrigin(): free-text → ISO code
 * - getDisplayName(): ISO code or free-text → human-readable name
 * - getCoordinates(): ISO code or free-text → { lat, lng }
 */

// ── Master record: ISO alpha-3 → display name + coordinates ──

const ISO_COUNTRIES: Record<string, { name: string; lat: number; lng: number }> = {
  // ── North America ──
  USA: { name: 'United States', lat: 38.9, lng: -77.0 },
  CAN: { name: 'Canada', lat: 45.4, lng: -75.7 },
  MEX: { name: 'Mexico', lat: 19.4, lng: -99.1 },
  CUB: { name: 'Cuba', lat: 23.1, lng: -82.4 },
  JAM: { name: 'Jamaica', lat: 18.0, lng: -76.8 },
  HTI: { name: 'Haiti', lat: 18.5, lng: -72.3 },
  DOM: { name: 'Dominican Republic', lat: 18.5, lng: -69.9 },
  CRI: { name: 'Costa Rica', lat: 9.9, lng: -84.1 },
  PAN: { name: 'Panama', lat: 9.0, lng: -79.5 },
  GTM: { name: 'Guatemala', lat: 14.6, lng: -90.5 },
  HND: { name: 'Honduras', lat: 14.1, lng: -87.2 },
  SLV: { name: 'El Salvador', lat: 13.7, lng: -89.2 },
  NIC: { name: 'Nicaragua', lat: 12.1, lng: -86.3 },
  TTO: { name: 'Trinidad and Tobago', lat: 10.7, lng: -61.5 },
  BHS: { name: 'Bahamas', lat: 25.0, lng: -77.3 },
  BRB: { name: 'Barbados', lat: 13.1, lng: -59.6 },
  PRI: { name: 'Puerto Rico', lat: 18.5, lng: -66.1 },

  // ── South America ──
  BRA: { name: 'Brazil', lat: -15.8, lng: -47.9 },
  ARG: { name: 'Argentina', lat: -34.6, lng: -58.4 },
  CHL: { name: 'Chile', lat: -33.4, lng: -70.7 },
  COL: { name: 'Colombia', lat: 4.7, lng: -74.1 },
  PER: { name: 'Peru', lat: -12.0, lng: -77.0 },
  VEN: { name: 'Venezuela', lat: 10.5, lng: -66.9 },
  ECU: { name: 'Ecuador', lat: -0.2, lng: -78.5 },
  BOL: { name: 'Bolivia', lat: -16.5, lng: -68.2 },
  PRY: { name: 'Paraguay', lat: -25.3, lng: -57.6 },
  URY: { name: 'Uruguay', lat: -34.9, lng: -56.2 },
  GUY: { name: 'Guyana', lat: 6.8, lng: -58.2 },
  SUR: { name: 'Suriname', lat: 5.9, lng: -55.2 },

  // ── Europe ──
  GBR: { name: 'United Kingdom', lat: 51.5, lng: -0.1 },
  FRA: { name: 'France', lat: 48.9, lng: 2.3 },
  DEU: { name: 'Germany', lat: 52.5, lng: 13.4 },
  ITA: { name: 'Italy', lat: 41.9, lng: 12.5 },
  ESP: { name: 'Spain', lat: 40.4, lng: -3.7 },
  PRT: { name: 'Portugal', lat: 38.7, lng: -9.1 },
  NLD: { name: 'Netherlands', lat: 52.4, lng: 4.9 },
  BEL: { name: 'Belgium', lat: 50.9, lng: 4.4 },
  CHE: { name: 'Switzerland', lat: 46.9, lng: 7.4 },
  AUT: { name: 'Austria', lat: 48.2, lng: 16.4 },
  SWE: { name: 'Sweden', lat: 59.3, lng: 18.1 },
  NOR: { name: 'Norway', lat: 59.9, lng: 10.8 },
  DNK: { name: 'Denmark', lat: 55.7, lng: 12.6 },
  FIN: { name: 'Finland', lat: 60.2, lng: 24.9 },
  GRC: { name: 'Greece', lat: 37.9, lng: 23.7 },
  POL: { name: 'Poland', lat: 52.2, lng: 21.0 },
  ROU: { name: 'Romania', lat: 44.4, lng: 26.1 },
  HUN: { name: 'Hungary', lat: 47.5, lng: 19.1 },
  CZE: { name: 'Czech Republic', lat: 50.1, lng: 14.4 },
  SVK: { name: 'Slovakia', lat: 48.1, lng: 17.1 },
  IRL: { name: 'Ireland', lat: 53.3, lng: -6.3 },
  ISL: { name: 'Iceland', lat: 64.1, lng: -21.9 },
  HRV: { name: 'Croatia', lat: 45.8, lng: 16.0 },
  SRB: { name: 'Serbia', lat: 44.8, lng: 20.5 },
  BGR: { name: 'Bulgaria', lat: 42.7, lng: 23.3 },
  UKR: { name: 'Ukraine', lat: 50.4, lng: 30.5 },
  BLR: { name: 'Belarus', lat: 53.9, lng: 27.6 },
  LTU: { name: 'Lithuania', lat: 54.7, lng: 25.3 },
  LVA: { name: 'Latvia', lat: 56.9, lng: 24.1 },
  EST: { name: 'Estonia', lat: 59.4, lng: 24.7 },
  SVN: { name: 'Slovenia', lat: 46.1, lng: 14.5 },
  LUX: { name: 'Luxembourg', lat: 49.6, lng: 6.1 },
  MLT: { name: 'Malta', lat: 35.9, lng: 14.5 },
  CYP: { name: 'Cyprus', lat: 35.2, lng: 33.4 },
  ALB: { name: 'Albania', lat: 41.3, lng: 19.8 },
  MKD: { name: 'North Macedonia', lat: 42.0, lng: 21.4 },
  BIH: { name: 'Bosnia and Herzegovina', lat: 43.9, lng: 18.4 },
  MNE: { name: 'Montenegro', lat: 42.4, lng: 19.3 },
  MDA: { name: 'Moldova', lat: 47.0, lng: 28.8 },
  VAT: { name: 'Vatican City', lat: 41.9, lng: 12.5 },
  MCO: { name: 'Monaco', lat: 43.7, lng: 7.4 },
  LIE: { name: 'Liechtenstein', lat: 47.2, lng: 9.5 },
  SMR: { name: 'San Marino', lat: 43.9, lng: 12.4 },
  AND: { name: 'Andorra', lat: 42.5, lng: 1.5 },
  RUS: { name: 'Russia', lat: 55.8, lng: 37.6 },

  // ── Asia ──
  CHN: { name: 'China', lat: 39.9, lng: 116.4 },
  JPN: { name: 'Japan', lat: 35.7, lng: 139.7 },
  IND: { name: 'India', lat: 28.6, lng: 77.2 },
  KOR: { name: 'South Korea', lat: 37.6, lng: 127.0 },
  PRK: { name: 'North Korea', lat: 39.0, lng: 125.8 },
  TWN: { name: 'Taiwan', lat: 25.0, lng: 121.5 },
  THA: { name: 'Thailand', lat: 13.8, lng: 100.5 },
  VNM: { name: 'Vietnam', lat: 21.0, lng: 105.8 },
  MYS: { name: 'Malaysia', lat: 3.1, lng: 101.7 },
  SGP: { name: 'Singapore', lat: 1.3, lng: 103.8 },
  IDN: { name: 'Indonesia', lat: -6.2, lng: 106.8 },
  PHL: { name: 'Philippines', lat: 14.6, lng: 121.0 },
  MMR: { name: 'Myanmar', lat: 16.9, lng: 96.2 },
  KHM: { name: 'Cambodia', lat: 11.6, lng: 104.9 },
  LAO: { name: 'Laos', lat: 17.9, lng: 102.6 },
  BGD: { name: 'Bangladesh', lat: 23.8, lng: 90.4 },
  LKA: { name: 'Sri Lanka', lat: 6.9, lng: 79.9 },
  NPL: { name: 'Nepal', lat: 27.7, lng: 85.3 },
  PAK: { name: 'Pakistan', lat: 33.7, lng: 73.1 },
  AFG: { name: 'Afghanistan', lat: 34.5, lng: 69.2 },
  TUR: { name: 'Turkey', lat: 39.9, lng: 32.9 },
  ISR: { name: 'Israel', lat: 31.8, lng: 35.2 },
  IRN: { name: 'Iran', lat: 35.7, lng: 51.4 },
  IRQ: { name: 'Iraq', lat: 33.3, lng: 44.4 },
  SAU: { name: 'Saudi Arabia', lat: 24.7, lng: 46.7 },
  ARE: { name: 'UAE', lat: 24.5, lng: 54.7 },
  QAT: { name: 'Qatar', lat: 25.3, lng: 51.5 },
  KWT: { name: 'Kuwait', lat: 29.4, lng: 47.9 },
  OMN: { name: 'Oman', lat: 23.6, lng: 58.5 },
  BHR: { name: 'Bahrain', lat: 26.2, lng: 50.6 },
  JOR: { name: 'Jordan', lat: 31.9, lng: 35.9 },
  LBN: { name: 'Lebanon', lat: 33.9, lng: 35.5 },
  SYR: { name: 'Syria', lat: 33.5, lng: 36.3 },
  YEM: { name: 'Yemen', lat: 15.4, lng: 44.2 },
  GEO: { name: 'Georgia', lat: 41.7, lng: 44.8 },
  ARM: { name: 'Armenia', lat: 40.2, lng: 44.5 },
  AZE: { name: 'Azerbaijan', lat: 40.4, lng: 49.9 },
  KAZ: { name: 'Kazakhstan', lat: 51.2, lng: 71.4 },
  UZB: { name: 'Uzbekistan', lat: 41.3, lng: 69.3 },
  MNG: { name: 'Mongolia', lat: 47.9, lng: 106.9 },
  BRN: { name: 'Brunei', lat: 4.9, lng: 114.9 },
  MDV: { name: 'Maldives', lat: 4.2, lng: 73.5 },
  BTN: { name: 'Bhutan', lat: 27.5, lng: 89.6 },

  // ── Oceania ──
  AUS: { name: 'Australia', lat: -35.3, lng: 149.1 },
  NZL: { name: 'New Zealand', lat: -41.3, lng: 174.8 },
  FJI: { name: 'Fiji', lat: -18.1, lng: 178.4 },
  PNG: { name: 'Papua New Guinea', lat: -6.3, lng: 147.2 },
  WSM: { name: 'Samoa', lat: -13.8, lng: -172.0 },
  TON: { name: 'Tonga', lat: -21.2, lng: -175.2 },

  // ── Africa ──
  ZAF: { name: 'South Africa', lat: -33.9, lng: 18.4 },
  EGY: { name: 'Egypt', lat: 30.0, lng: 31.2 },
  MAR: { name: 'Morocco', lat: 34.0, lng: -6.8 },
  NGA: { name: 'Nigeria', lat: 9.1, lng: 7.5 },
  KEN: { name: 'Kenya', lat: -1.3, lng: 36.8 },
  ETH: { name: 'Ethiopia', lat: 9.0, lng: 38.7 },
  GHA: { name: 'Ghana', lat: 5.6, lng: -0.2 },
  TZA: { name: 'Tanzania', lat: -6.8, lng: 37.3 },
  DZA: { name: 'Algeria', lat: 36.8, lng: 3.1 },
  TUN: { name: 'Tunisia', lat: 36.8, lng: 10.2 },
  LBY: { name: 'Libya', lat: 32.9, lng: 13.2 },
  SDN: { name: 'Sudan', lat: 15.6, lng: 32.5 },
  UGA: { name: 'Uganda', lat: 0.3, lng: 32.6 },
  SEN: { name: 'Senegal', lat: 14.7, lng: -17.5 },
  CIV: { name: 'Ivory Coast', lat: 6.8, lng: -5.3 },
  CMR: { name: 'Cameroon', lat: 3.9, lng: 11.5 },
  AGO: { name: 'Angola', lat: -8.8, lng: 13.2 },
  MOZ: { name: 'Mozambique', lat: -25.9, lng: 32.6 },
  MDG: { name: 'Madagascar', lat: -18.9, lng: 47.5 },
  ZWE: { name: 'Zimbabwe', lat: -17.8, lng: 31.0 },
  ZMB: { name: 'Zambia', lat: -15.4, lng: 28.3 },
  BWA: { name: 'Botswana', lat: -24.7, lng: 25.9 },
  NAM: { name: 'Namibia', lat: -22.6, lng: 17.1 },
  RWA: { name: 'Rwanda', lat: -1.9, lng: 29.9 },
  MUS: { name: 'Mauritius', lat: -20.2, lng: 57.5 },
  COD: { name: 'DR Congo', lat: -4.3, lng: 15.3 },
  COG: { name: 'Congo', lat: -4.3, lng: 15.3 },
  MLI: { name: 'Mali', lat: 12.6, lng: -8.0 },
  BFA: { name: 'Burkina Faso', lat: 12.4, lng: -1.5 },
  NER: { name: 'Niger', lat: 13.5, lng: 2.1 },
  TCD: { name: 'Chad', lat: 12.1, lng: 15.0 },
  SOM: { name: 'Somalia', lat: 2.0, lng: 45.3 },
  ERI: { name: 'Eritrea', lat: 15.3, lng: 38.9 },
  LBR: { name: 'Liberia', lat: 6.3, lng: -10.8 },
  SLE: { name: 'Sierra Leone', lat: 8.5, lng: -13.2 },
  TGO: { name: 'Togo', lat: 6.1, lng: 1.2 },
  BEN: { name: 'Benin', lat: 6.4, lng: 2.6 },
};

// ── Alias map: lowercase string → ISO alpha-3 code ──
// Includes display names, common abbreviations, historical names, and ISO codes themselves.

const NAME_TO_ISO: Record<string, string> = {};

// Auto-populate from ISO_COUNTRIES: map lowercase display name → code, and lowercase code → code
for (const [code, { name }] of Object.entries(ISO_COUNTRIES)) {
  NAME_TO_ISO[code.toLowerCase()] = code;
  NAME_TO_ISO[name.toLowerCase()] = code;
}

// Manual aliases for common variants, abbreviations, and historical names
const MANUAL_ALIASES: Record<string, string> = {
  // United States
  'us': 'USA', 'u.s.': 'USA', 'u.s.a.': 'USA',
  'united states of america': 'USA', 'america': 'USA',

  // United Kingdom
  'uk': 'GBR', 'u.k.': 'GBR', 'great britain': 'GBR',
  'britain': 'GBR', 'england': 'GBR', 'scotland': 'GBR', 'wales': 'GBR',

  // Russia
  'russian federation': 'RUS', 'ussr': 'RUS', 'soviet union': 'RUS',

  // China
  'prc': 'CHN', "people's republic of china": 'CHN',

  // Taiwan
  'republic of china': 'TWN', 'roc': 'TWN', 'chinese taipei': 'TWN',

  // South Korea
  'korea': 'KOR', 'republic of korea': 'KOR',

  // North Korea
  'dprk': 'PRK',

  // Germany
  'west germany': 'DEU', 'east germany': 'DEU',
  'federal republic of germany': 'DEU', 'prussia': 'DEU', 'bavaria': 'DEU',

  // Netherlands
  'holland': 'NLD', 'the netherlands': 'NLD',

  // Czech Republic
  'czechia': 'CZE',

  // Iran
  'persia': 'IRN',

  // Thailand
  'siam': 'THA',

  // Sri Lanka
  'ceylon': 'LKA',

  // Myanmar
  'burma': 'MMR',

  // DR Congo
  'democratic republic of the congo': 'COD', 'drc': 'COD',
  'zaire': 'COD', 'congo-kinshasa': 'COD',

  // Republic of Congo
  'republic of the congo': 'COG', 'congo-brazzaville': 'COG',

  // Ivory Coast
  "côte d'ivoire": 'CIV', "cote d'ivoire": 'CIV',

  // UAE
  'uae': 'ARE', 'united arab emirates': 'ARE',

  // Vatican
  'vatican': 'VAT', 'holy see': 'VAT',

  // Guyana (historical)
  'british guiana': 'GUY',

  // Zimbabwe (historical)
  'rhodesia': 'ZWE',
};

for (const [alias, code] of Object.entries(MANUAL_ALIASES)) {
  NAME_TO_ISO[alias] = code;
}

// ── Exported functions ──

function titleCaseOrigin(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return trimmed;
  return trimmed
    .split(/\s+/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Normalize an AI-returned or user-entered origin string to an ISO alpha-3 code.
 * If the input is already a valid ISO code, returns it directly.
 * Falls back to title-cased input if no match is found.
 */
export function normalizeOrigin(raw: string): string {
  const key = raw.trim().toLowerCase();
  if (!key) return raw;

  // Direct ISO code match (e.g. "USA", "GBR")
  const upper = raw.trim().toUpperCase();
  if (ISO_COUNTRIES[upper]) return upper;

  // Alias lookup
  if (NAME_TO_ISO[key]) return NAME_TO_ISO[key];

  // Fallback: title-case for unknown origins
  return titleCaseOrigin(raw);
}

/**
 * Get the human-readable display name for an ISO code or raw origin string.
 * Accepts ISO alpha-3 codes, display names, or aliases.
 */
export function getDisplayName(isoOrRaw: string): string {
  const trimmed = isoOrRaw.trim();
  if (!trimmed) return trimmed;

  // Direct ISO code lookup
  const upper = trimmed.toUpperCase();
  if (ISO_COUNTRIES[upper]) return ISO_COUNTRIES[upper].name;

  // Try alias → ISO → display name
  const key = trimmed.toLowerCase();
  const isoCode = NAME_TO_ISO[key];
  if (isoCode && ISO_COUNTRIES[isoCode]) return ISO_COUNTRIES[isoCode].name;

  // Fallback: return as-is (likely already a display name or unknown)
  return trimmed;
}

/**
 * Get coordinates for an ISO code or raw origin string.
 * Returns null if the origin is not recognized.
 */
export function getCoordinates(isoOrRaw: string): { lat: number; lng: number } | null {
  const trimmed = isoOrRaw.trim();
  if (!trimmed) return null;

  // Direct ISO code lookup
  const upper = trimmed.toUpperCase();
  if (ISO_COUNTRIES[upper]) {
    const { lat, lng } = ISO_COUNTRIES[upper];
    return { lat, lng };
  }

  // Try alias → ISO → coordinates
  const key = trimmed.toLowerCase();
  const isoCode = NAME_TO_ISO[key];
  if (isoCode && ISO_COUNTRIES[isoCode]) {
    const { lat, lng } = ISO_COUNTRIES[isoCode];
    return { lat, lng };
  }

  return null;
}
