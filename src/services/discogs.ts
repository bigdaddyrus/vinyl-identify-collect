const API_BASE = 'https://api.discogs.com';
const TIMEOUT_MS = 10_000;

export interface DiscogsTrack {
  position: string;
  title: string;
  duration: string;
}

export interface DiscogsCompany {
  name: string;
  role: string;
  catno: string;
}

export interface DiscogsCommunity {
  have: number;
  want: number;
}

export interface DiscogsImage {
  type: string; // 'primary' | 'secondary'
  uri: string; // Full-size image URL
  uri150: string; // 150px thumbnail URL
  width: number;
  height: number;
}

export interface DiscogsExtraArtist {
  name: string;
  role: string;
}

export interface DiscogsResult {
  artist: string;
  title: string;
  year: string;
  released: string; // "YYYY-MM-DD" original release date from Discogs
  label: string;
  genre: string;
  country: string;
  tracklist: DiscogsTrack[];
  catNo: string;
  formats: string[];
  // Enriched fields
  thumbnail: string;
  primaryImage: string;
  discogsImages: DiscogsImage[]; // All images from Discogs release
  styles: string[];
  weight: string;
  companies: DiscogsCompany[]; // Pressing plants, distributors, etc.
  extraArtists: DiscogsExtraArtist[]; // Person credits (e.g. "Mastered By", "Producer")
  discogsUrl: string;
  discogsId: number;
  lowestPrice: number | null;
  numForSale: number | null;
  community: DiscogsCommunity | null;
}

function getAuthParams(): string | null {
  const key = process.env.EXPO_PUBLIC_DISCOGS_KEY;
  const secret = process.env.EXPO_PUBLIC_DISCOGS_SECRET;
  if (key && secret) return `key=${key}&secret=${secret}`;

  const token = process.env.EXPO_PUBLIC_DISCOGS_TOKEN;
  if (token) return `token=${token}`;

  return null;
}

function getAuthHeader(): Record<string, string> {
  const key = process.env.EXPO_PUBLIC_DISCOGS_KEY;
  const secret = process.env.EXPO_PUBLIC_DISCOGS_SECRET;
  if (key && secret) {
    return {
      'Authorization': `Discogs key=${key}, secret=${secret}`,
      'User-Agent': 'VinylCollect/1.0',
    };
  }

  const token = process.env.EXPO_PUBLIC_DISCOGS_TOKEN;
  if (token) {
    return {
      'Authorization': `Discogs token=${token}`,
      'User-Agent': 'VinylCollect/1.0',
    };
  }

  return { 'User-Agent': 'VinylCollect/1.0' };
}

async function fetchWithTimeout(url: string, headers: Record<string, string>): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    return await fetch(url, { headers, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Fetch a full Discogs release by ID and return structured metadata.
 */
async function fetchRelease(releaseId: number, headers: Record<string, string>): Promise<DiscogsResult | null> {
  const releaseUrl = `${API_BASE}/releases/${releaseId}`;
  const releaseRes = await fetchWithTimeout(releaseUrl, headers);
  if (!releaseRes.ok) return null;

  const release = await releaseRes.json();

  const rawImages: { type: string; uri: string; uri150: string; width?: number; height?: number }[] = release.images ?? [];
  const primaryImg = rawImages.find((img) => img.type === 'primary') ?? rawImages[0];
  const allDiscogsImages: DiscogsImage[] = rawImages.map((img) => ({
    type: img.type ?? 'secondary',
    uri: img.uri ?? '',
    uri150: img.uri150 ?? '',
    width: img.width ?? 0,
    height: img.height ?? 0,
  }));

  let weight = '';
  for (const fmt of release.formats ?? []) {
    for (const desc of fmt.descriptions ?? []) {
      const weightMatch = String(desc).match(/(\d+)\s*(?:g(?:ram)?|G(?:ram)?)/i);
      if (weightMatch) {
        weight = `${weightMatch[1]}g`;
        break;
      }
    }
    if (weight) break;
  }

  return {
    artist: release.artists?.map((a: { name: string }) => a.name).join(', ') ?? 'Unknown',
    title: release.title ?? 'Unknown',
    year: String(release.year ?? 'Unknown'),
    released: release.released ?? '',
    label: release.labels?.[0]?.name ?? 'Unknown',
    genre: release.genres?.[0] ?? 'Unknown',
    country: release.country ?? 'Unknown',
    tracklist: (release.tracklist ?? []).map((t: { position?: string; title: string; duration?: string }) => ({
      position: t.position ?? '',
      title: t.title ?? '',
      duration: t.duration ?? '',
    })),
    catNo: release.labels?.[0]?.catno ?? '',
    formats: release.formats?.map((f: { name: string }) => f.name) ?? [],
    thumbnail: primaryImg?.uri150 ?? '',
    primaryImage: primaryImg?.uri ?? '',
    discogsImages: allDiscogsImages,
    styles: release.styles ?? [],
    weight,
    companies: (release.companies ?? [])
      .map((c: { name: string; catno?: string; entity_type_name?: string }) => ({
        name: c.name ?? '',
        role: c.entity_type_name ?? '',
        catno: c.catno ?? '',
      }))
      .filter((c: DiscogsCompany) => c.name),
    extraArtists: (release.extraartists ?? [])
      .map((a: { name: string; role?: string }) => ({
        name: a.name ?? '',
        role: a.role ?? '',
      }))
      .filter((a: DiscogsExtraArtist) => a.name),
    discogsUrl: release.uri ?? '',
    discogsId: release.id ?? 0,
    lowestPrice: release.lowest_price ?? null,
    numForSale: release.num_for_sale ?? null,
    community: release.community
      ? { have: release.community.have ?? 0, want: release.community.want ?? 0 }
      : null,
  };
}

/**
 * Search Discogs by artist + title query and return structured metadata.
 * Returns null if no match found or if credentials are not configured.
 */
export async function searchByQuery(query: string): Promise<DiscogsResult | null> {
  const authParams = getAuthParams();
  if (!authParams) return null;

  const headers = getAuthHeader();

  try {
    const searchUrl = `${API_BASE}/database/search?q=${encodeURIComponent(query)}&type=release&per_page=3`;
    const searchRes = await fetchWithTimeout(searchUrl, headers);
    if (!searchRes.ok) return null;

    const searchData = await searchRes.json();
    const firstResult = searchData.results?.[0];
    if (!firstResult) return null;

    return fetchRelease(firstResult.id, headers);
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      console.log('[Discogs] ❌ Query search timed out');
    }
    return null;
  }
}

/**
 * Search Discogs by barcode (EAN/UPC) and return structured metadata.
 * Returns null if no match found or if credentials are not configured.
 */
export async function searchByBarcode(barcode: string): Promise<DiscogsResult | null> {
  console.log('[Discogs] searchByBarcode called with:', barcode);

  const authParams = getAuthParams();
  if (!authParams) {
    console.log('[Discogs] ❌ No API credentials found');
    return null;
  }

  const headers = getAuthHeader();

  try {
    console.log(`[Discogs] 🔍 Searching barcode: ${barcode}`);

    const searchUrl = `${API_BASE}/database/search?barcode=${encodeURIComponent(barcode)}&type=release`;
    const searchRes = await fetchWithTimeout(searchUrl, headers);

    if (!searchRes.ok) return null;

    const searchData = await searchRes.json();
    console.log(`[Discogs] Search results count: ${searchData.results?.length ?? 0}`);

    const firstResult = searchData.results?.[0];
    if (!firstResult) {
      console.log('[Discogs] ❌ No results found for barcode');
      return null;
    }

    console.log(`[Discogs] ✅ Found: ${firstResult.title} (ID: ${firstResult.id})`);
    return fetchRelease(firstResult.id, headers);
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      console.log('[Discogs] ❌ Request timed out after', TIMEOUT_MS, 'ms');
    } else {
      console.log('[Discogs] ❌ Error:', err);
    }
    return null;
  }
}
