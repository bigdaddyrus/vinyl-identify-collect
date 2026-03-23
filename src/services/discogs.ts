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
 * Returns null if no match found or if the token is not configured.
 */
export async function searchByBarcode(barcode: string): Promise<DiscogsResult | null> {
  const token = process.env.EXPO_PUBLIC_DISCOGS_TOKEN;
  if (!token) {
    console.warn('[Discogs] EXPO_PUBLIC_DISCOGS_TOKEN not configured, skipping lookup');
    return null;
  }

  const headers = {
    'Authorization': `Discogs token=${token}`,
    'User-Agent': 'VinylCollect/1.0',
  };

  try {
    console.log(`[Discogs] Searching barcode: ${barcode}`);

    const searchUrl = `${API_BASE}/database/search?barcode=${encodeURIComponent(barcode)}&type=release&token=${token}`;
    const searchRes = await fetchWithTimeout(searchUrl, headers);

    if (!searchRes.ok) {
      console.warn(`[Discogs] Search failed: ${searchRes.status}`);
      return null;
    }

    const searchData = await searchRes.json();
    const firstResult = searchData.results?.[0];
    if (!firstResult) {
      console.log('[Discogs] No results found for barcode');
      return null;
    }

    console.log(`[Discogs] Found: ${firstResult.title} (ID: ${firstResult.id})`);

    // Fetch full release details
    const releaseUrl = `${API_BASE}/releases/${firstResult.id}`;
    const releaseRes = await fetchWithTimeout(releaseUrl, headers);

    if (!releaseRes.ok) {
      console.warn(`[Discogs] Release fetch failed: ${releaseRes.status}`);
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

    console.log('[Discogs] Release data:', {
      artist: result.artist,
      title: result.title,
      year: result.year,
      label: result.label,
    });

    return result;
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      console.warn('[Discogs] Request timed out');
    } else {
      console.warn('[Discogs] Error:', err);
    }
    return null;
  }
}
