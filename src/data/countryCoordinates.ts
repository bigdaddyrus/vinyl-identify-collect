/**
 * Country/territory → approximate lat/lng lookup for map markers.
 * Keys are CANONICAL country names (lowercase-normalized via normalizeOrigin).
 * Coordinates based on capital/major-city positions.
 */

/**
 * Maps common aliases, abbreviations, and AI-returned variants to a single
 * canonical country name. Lookup is case-insensitive (trimmed + lowercased).
 */
const COUNTRY_ALIASES: Record<string, string> = {
  // United States
  'us': 'United States',
  'usa': 'United States',
  'u.s.': 'United States',
  'u.s.a.': 'United States',
  'united states': 'United States',
  'united states of america': 'United States',
  'america': 'United States',

  // United Kingdom
  'uk': 'United Kingdom',
  'u.k.': 'United Kingdom',
  'united kingdom': 'United Kingdom',
  'great britain': 'United Kingdom',
  'britain': 'United Kingdom',
  'england': 'United Kingdom',
  'scotland': 'United Kingdom',
  'wales': 'United Kingdom',

  // Russia
  'russia': 'Russia',
  'russian federation': 'Russia',
  'ussr': 'Russia',
  'soviet union': 'Russia',

  // China
  'china': 'China',
  'prc': 'China',
  "people's republic of china": 'China',

  // Taiwan
  'taiwan': 'Taiwan',
  'republic of china': 'Taiwan',
  'roc': 'Taiwan',
  'chinese taipei': 'Taiwan',

  // South Korea
  'south korea': 'South Korea',
  'korea': 'South Korea',
  'republic of korea': 'South Korea',

  // North Korea
  'north korea': 'North Korea',
  'dprk': 'North Korea',

  // Germany
  'germany': 'Germany',
  'west germany': 'Germany',
  'east germany': 'Germany',
  'federal republic of germany': 'Germany',
  'prussia': 'Germany',
  'bavaria': 'Germany',

  // Netherlands
  'netherlands': 'Netherlands',
  'holland': 'Netherlands',
  'the netherlands': 'Netherlands',

  // Czech Republic
  'czech republic': 'Czech Republic',
  'czechia': 'Czech Republic',

  // Iran
  'iran': 'Iran',
  'persia': 'Iran',

  // Thailand
  'thailand': 'Thailand',
  'siam': 'Thailand',

  // Sri Lanka
  'sri lanka': 'Sri Lanka',
  'ceylon': 'Sri Lanka',

  // Myanmar
  'myanmar': 'Myanmar',
  'burma': 'Myanmar',

  // DR Congo
  'democratic republic of the congo': 'DR Congo',
  'drc': 'DR Congo',
  'zaire': 'DR Congo',
  'dr congo': 'DR Congo',
  'congo-kinshasa': 'DR Congo',

  // Republic of Congo
  'republic of the congo': 'Congo',
  'congo': 'Congo',
  'congo-brazzaville': 'Congo',

  // Ivory Coast
  'ivory coast': 'Ivory Coast',
  "côte d'ivoire": 'Ivory Coast',
  "cote d'ivoire": 'Ivory Coast',

  // UAE
  'uae': 'UAE',
  'united arab emirates': 'UAE',

  // Vatican
  'vatican': 'Vatican City',
  'vatican city': 'Vatican City',
  'holy see': 'Vatican City',

  // Guyana (historical)
  'british guiana': 'Guyana',
  'guyana': 'Guyana',

  // Zimbabwe (historical)
  'rhodesia': 'Zimbabwe',
  'zimbabwe': 'Zimbabwe',
};

/**
 * Normalize an AI-returned origin string to a canonical country name.
 * Falls back to title-cased input if no alias is found.
 */
function titleCaseOrigin(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return trimmed;
  return trimmed
    .split(/\s+/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

export function normalizeOrigin(raw: string): string {
  const key = raw.trim().toLowerCase();
  if (COUNTRY_ALIASES[key]) return COUNTRY_ALIASES[key];
  // Return a title-cased version of the original input
  return titleCaseOrigin(raw);
}

export const countryCoordinates: Record<string, { lat: number; lng: number }> = {
  // ── North America ──
  'United States': { lat: 38.9, lng: -77.0 },
  'Canada': { lat: 45.4, lng: -75.7 },
  'Mexico': { lat: 19.4, lng: -99.1 },
  'Cuba': { lat: 23.1, lng: -82.4 },
  'Jamaica': { lat: 18.0, lng: -76.8 },
  'Haiti': { lat: 18.5, lng: -72.3 },
  'Dominican Republic': { lat: 18.5, lng: -69.9 },
  'Costa Rica': { lat: 9.9, lng: -84.1 },
  'Panama': { lat: 9.0, lng: -79.5 },
  'Guatemala': { lat: 14.6, lng: -90.5 },
  'Honduras': { lat: 14.1, lng: -87.2 },
  'El Salvador': { lat: 13.7, lng: -89.2 },
  'Nicaragua': { lat: 12.1, lng: -86.3 },
  'Trinidad and Tobago': { lat: 10.7, lng: -61.5 },
  'Bahamas': { lat: 25.0, lng: -77.3 },
  'Barbados': { lat: 13.1, lng: -59.6 },
  'Puerto Rico': { lat: 18.5, lng: -66.1 },
  'Hawaii': { lat: 21.3, lng: -157.8 },

  // ── South America ──
  'Brazil': { lat: -15.8, lng: -47.9 },
  'Argentina': { lat: -34.6, lng: -58.4 },
  'Chile': { lat: -33.4, lng: -70.7 },
  'Colombia': { lat: 4.7, lng: -74.1 },
  'Peru': { lat: -12.0, lng: -77.0 },
  'Venezuela': { lat: 10.5, lng: -66.9 },
  'Ecuador': { lat: -0.2, lng: -78.5 },
  'Bolivia': { lat: -16.5, lng: -68.2 },
  'Paraguay': { lat: -25.3, lng: -57.6 },
  'Uruguay': { lat: -34.9, lng: -56.2 },
  'Guyana': { lat: 6.8, lng: -58.2 },
  'Suriname': { lat: 5.9, lng: -55.2 },

  // ── Europe ──
  'United Kingdom': { lat: 51.5, lng: -0.1 },
  'France': { lat: 48.9, lng: 2.3 },
  'Germany': { lat: 52.5, lng: 13.4 },
  'Italy': { lat: 41.9, lng: 12.5 },
  'Spain': { lat: 40.4, lng: -3.7 },
  'Portugal': { lat: 38.7, lng: -9.1 },
  'Netherlands': { lat: 52.4, lng: 4.9 },
  'Belgium': { lat: 50.9, lng: 4.4 },
  'Switzerland': { lat: 46.9, lng: 7.4 },
  'Austria': { lat: 48.2, lng: 16.4 },
  'Sweden': { lat: 59.3, lng: 18.1 },
  'Norway': { lat: 59.9, lng: 10.8 },
  'Denmark': { lat: 55.7, lng: 12.6 },
  'Finland': { lat: 60.2, lng: 24.9 },
  'Greece': { lat: 37.9, lng: 23.7 },
  'Poland': { lat: 52.2, lng: 21.0 },
  'Romania': { lat: 44.4, lng: 26.1 },
  'Hungary': { lat: 47.5, lng: 19.1 },
  'Czech Republic': { lat: 50.1, lng: 14.4 },
  'Slovakia': { lat: 48.1, lng: 17.1 },
  'Ireland': { lat: 53.3, lng: -6.3 },
  'Iceland': { lat: 64.1, lng: -21.9 },
  'Croatia': { lat: 45.8, lng: 16.0 },
  'Serbia': { lat: 44.8, lng: 20.5 },
  'Bulgaria': { lat: 42.7, lng: 23.3 },
  'Ukraine': { lat: 50.4, lng: 30.5 },
  'Belarus': { lat: 53.9, lng: 27.6 },
  'Lithuania': { lat: 54.7, lng: 25.3 },
  'Latvia': { lat: 56.9, lng: 24.1 },
  'Estonia': { lat: 59.4, lng: 24.7 },
  'Slovenia': { lat: 46.1, lng: 14.5 },
  'Luxembourg': { lat: 49.6, lng: 6.1 },
  'Malta': { lat: 35.9, lng: 14.5 },
  'Cyprus': { lat: 35.2, lng: 33.4 },
  'Albania': { lat: 41.3, lng: 19.8 },
  'North Macedonia': { lat: 42.0, lng: 21.4 },
  'Bosnia and Herzegovina': { lat: 43.9, lng: 18.4 },
  'Montenegro': { lat: 42.4, lng: 19.3 },
  'Moldova': { lat: 47.0, lng: 28.8 },
  'Vatican City': { lat: 41.9, lng: 12.5 },
  'Monaco': { lat: 43.7, lng: 7.4 },
  'Liechtenstein': { lat: 47.2, lng: 9.5 },
  'San Marino': { lat: 43.9, lng: 12.4 },
  'Andorra': { lat: 42.5, lng: 1.5 },
  'Russia': { lat: 55.8, lng: 37.6 },

  // ── Asia ──
  'China': { lat: 39.9, lng: 116.4 },
  'Japan': { lat: 35.7, lng: 139.7 },
  'India': { lat: 28.6, lng: 77.2 },
  'South Korea': { lat: 37.6, lng: 127.0 },
  'North Korea': { lat: 39.0, lng: 125.8 },
  'Taiwan': { lat: 25.0, lng: 121.5 },
  'Thailand': { lat: 13.8, lng: 100.5 },
  'Vietnam': { lat: 21.0, lng: 105.8 },
  'Malaysia': { lat: 3.1, lng: 101.7 },
  'Singapore': { lat: 1.3, lng: 103.8 },
  'Indonesia': { lat: -6.2, lng: 106.8 },
  'Philippines': { lat: 14.6, lng: 121.0 },
  'Myanmar': { lat: 16.9, lng: 96.2 },
  'Cambodia': { lat: 11.6, lng: 104.9 },
  'Laos': { lat: 17.9, lng: 102.6 },
  'Bangladesh': { lat: 23.8, lng: 90.4 },
  'Sri Lanka': { lat: 6.9, lng: 79.9 },
  'Nepal': { lat: 27.7, lng: 85.3 },
  'Pakistan': { lat: 33.7, lng: 73.1 },
  'Afghanistan': { lat: 34.5, lng: 69.2 },
  'Turkey': { lat: 39.9, lng: 32.9 },
  'Israel': { lat: 31.8, lng: 35.2 },
  'Iran': { lat: 35.7, lng: 51.4 },
  'Iraq': { lat: 33.3, lng: 44.4 },
  'Saudi Arabia': { lat: 24.7, lng: 46.7 },
  'UAE': { lat: 24.5, lng: 54.7 },
  'Qatar': { lat: 25.3, lng: 51.5 },
  'Kuwait': { lat: 29.4, lng: 47.9 },
  'Oman': { lat: 23.6, lng: 58.5 },
  'Bahrain': { lat: 26.2, lng: 50.6 },
  'Jordan': { lat: 31.9, lng: 35.9 },
  'Lebanon': { lat: 33.9, lng: 35.5 },
  'Syria': { lat: 33.5, lng: 36.3 },
  'Yemen': { lat: 15.4, lng: 44.2 },
  'Georgia': { lat: 41.7, lng: 44.8 },
  'Armenia': { lat: 40.2, lng: 44.5 },
  'Azerbaijan': { lat: 40.4, lng: 49.9 },
  'Kazakhstan': { lat: 51.2, lng: 71.4 },
  'Uzbekistan': { lat: 41.3, lng: 69.3 },
  'Mongolia': { lat: 47.9, lng: 106.9 },
  'Brunei': { lat: 4.9, lng: 114.9 },
  'Maldives': { lat: 4.2, lng: 73.5 },
  'Bhutan': { lat: 27.5, lng: 89.6 },

  // ── Oceania ──
  'Australia': { lat: -35.3, lng: 149.1 },
  'New Zealand': { lat: -41.3, lng: 174.8 },
  'Fiji': { lat: -18.1, lng: 178.4 },
  'Papua New Guinea': { lat: -6.3, lng: 147.2 },
  'Samoa': { lat: -13.8, lng: -172.0 },
  'Tonga': { lat: -21.2, lng: -175.2 },

  // ── Africa ──
  'South Africa': { lat: -33.9, lng: 18.4 },
  'Egypt': { lat: 30.0, lng: 31.2 },
  'Morocco': { lat: 34.0, lng: -6.8 },
  'Nigeria': { lat: 9.1, lng: 7.5 },
  'Kenya': { lat: -1.3, lng: 36.8 },
  'Ethiopia': { lat: 9.0, lng: 38.7 },
  'Ghana': { lat: 5.6, lng: -0.2 },
  'Tanzania': { lat: -6.8, lng: 37.3 },
  'Algeria': { lat: 36.8, lng: 3.1 },
  'Tunisia': { lat: 36.8, lng: 10.2 },
  'Libya': { lat: 32.9, lng: 13.2 },
  'Sudan': { lat: 15.6, lng: 32.5 },
  'Uganda': { lat: 0.3, lng: 32.6 },
  'Senegal': { lat: 14.7, lng: -17.5 },
  'Ivory Coast': { lat: 6.8, lng: -5.3 },
  'Cameroon': { lat: 3.9, lng: 11.5 },
  'Angola': { lat: -8.8, lng: 13.2 },
  'Mozambique': { lat: -25.9, lng: 32.6 },
  'Madagascar': { lat: -18.9, lng: 47.5 },
  'Zimbabwe': { lat: -17.8, lng: 31.0 },
  'Zambia': { lat: -15.4, lng: 28.3 },
  'Botswana': { lat: -24.7, lng: 25.9 },
  'Namibia': { lat: -22.6, lng: 17.1 },
  'Rwanda': { lat: -1.9, lng: 29.9 },
  'Mauritius': { lat: -20.2, lng: 57.5 },
  'DR Congo': { lat: -4.3, lng: 15.3 },
  'Congo': { lat: -4.3, lng: 15.3 },
  'Mali': { lat: 12.6, lng: -8.0 },
  'Burkina Faso': { lat: 12.4, lng: -1.5 },
  'Niger': { lat: 13.5, lng: 2.1 },
  'Chad': { lat: 12.1, lng: 15.0 },
  'Somalia': { lat: 2.0, lng: 45.3 },
  'Eritrea': { lat: 15.3, lng: 38.9 },
  'Liberia': { lat: 6.3, lng: -10.8 },
  'Sierra Leone': { lat: 8.5, lng: -13.2 },
  'Togo': { lat: 6.1, lng: 1.2 },
  'Benin': { lat: 6.4, lng: 2.6 },
};
