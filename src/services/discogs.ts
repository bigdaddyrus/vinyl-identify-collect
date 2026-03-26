const API_BASE = 'https://api.discogs.com';
const TIMEOUT_MS = 10_000;

export interface DiscogsResult {
  artist: string;
  title: string;
  year: string;
  label: string;
  genre: string;
  country: string;
  tracklist: string[];
  catNo: string;
  formats: string[];
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
 * Search Discogs by barcode (EAN/UPC) and return structured metadata.
 * Returns null if no match found or if credentials are not configured.
 */
export async function searchByBarcode(barcode: string): Promise<DiscogsResult | null> {
  console.log('[Discogs] searchByBarcode called with:', barcode);

  const key = process.env.EXPO_PUBLIC_DISCOGS_KEY;
  const secret = process.env.EXPO_PUBLIC_DISCOGS_SECRET;
  const token = process.env.EXPO_PUBLIC_DISCOGS_TOKEN;

  console.log('[Discogs] Env vars:', {
    EXPO_PUBLIC_DISCOGS_KEY: key ? `${key.substring(0, 6)}...` : '(not set)',
    EXPO_PUBLIC_DISCOGS_SECRET: secret ? `${secret.substring(0, 6)}...` : '(not set)',
    EXPO_PUBLIC_DISCOGS_TOKEN: token ? `${token.substring(0, 6)}...` : '(not set)',
  });

  const authParams = getAuthParams();
  if (!authParams) {
    console.log('[Discogs] ❌ No API credentials found — did you restart Metro with --clear after adding .env.local?');
    return null;
  }

  const headers = getAuthHeader();

  try {
    console.log(`[Discogs] 🔍 Searching barcode: ${barcode}`);

    const searchUrl = `${API_BASE}/database/search?barcode=${encodeURIComponent(barcode)}&type=release`;
    console.log('[Discogs] Search URL:', searchUrl);

    const searchRes = await fetchWithTimeout(searchUrl, headers);
    console.log(`[Discogs] Search response: ${searchRes.status} ${searchRes.statusText}`);

    if (!searchRes.ok) {
      const errorBody = await searchRes.text().catch(() => '(could not read body)');
      console.log(`[Discogs] ❌ Search failed: ${searchRes.status} — ${errorBody}`);
      return null;
    }

    const searchData = await searchRes.json();
    console.log(`[Discogs] Search results count: ${searchData.results?.length ?? 0}`);

    const firstResult = searchData.results?.[0];
    if (!firstResult) {
      console.log('[Discogs] ❌ No results found for barcode');
      return null;
    }

    console.log(`[Discogs] ✅ Found: ${firstResult.title} (ID: ${firstResult.id})`);

    // Fetch full release details
    const releaseUrl = `${API_BASE}/releases/${firstResult.id}`;
    console.log('[Discogs] Fetching release:', releaseUrl);

    const releaseRes = await fetchWithTimeout(releaseUrl, headers);
    console.log(`[Discogs] Release response: ${releaseRes.status} ${releaseRes.statusText}`);

    if (!releaseRes.ok) {
      const errorBody = await releaseRes.text().catch(() => '(could not read body)');
      console.log(`[Discogs] ❌ Release fetch failed: ${releaseRes.status} — ${errorBody}`);
      return null;
    }

    const release = await releaseRes.json();

    const result: DiscogsResult = {
      artist: release.artists?.map((a: { name: string }) => a.name).join(', ') ?? 'Unknown',
      title: release.title ?? 'Unknown',
      year: String(release.year ?? 'Unknown'),
      label: release.labels?.[0]?.name ?? 'Unknown',
      genre: release.genres?.[0] ?? 'Unknown',
      country: release.country ?? 'Unknown',
      tracklist: release.tracklist?.map((t: { title: string }) => t.title) ?? [],
      catNo: release.labels?.[0]?.catno ?? '',
      formats: release.formats?.map((f: { name: string }) => f.name) ?? [],
    };

    console.log('[Discogs] ✅ Release data:', JSON.stringify(result, null, 2));

    return result;
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      console.log('[Discogs] ❌ Request timed out after', TIMEOUT_MS, 'ms');
    } else {
      console.log('[Discogs] ❌ Error:', err);
    }
    return null;
  }
}
