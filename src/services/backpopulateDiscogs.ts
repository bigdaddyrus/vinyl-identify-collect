import { searchByBarcode, searchByQuery } from './discogs';
import type { DiscogsResult } from './discogs';
import { AnalysisResult } from '@/types';
import { buildDiscogsUpdates } from '@/utils/mergeDiscogs';

const RATE_LIMIT_MS = 1200; // ~50 requests/min to stay within Discogs limits

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Extract a search query from an item name (e.g. "Artist — Album Title (edition)" → "Artist Album Title") */
function buildQuery(item: AnalysisResult): string {
  return item.name
    .replace(/\s*[—–-]\s*/g, ' ')
    .replace(/\([^)]*\)/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export interface BackpopulateProgress {
  current: number;
  total: number;
  enriched: number;
  failed: number;
  currentItem: string;
}

/**
 * Backpopulate Discogs data for collection items that don't have it yet.
 * Uses barcode search when available, falls back to name-based query search.
 * Rate-limited to stay within Discogs API limits.
 */
export async function backpopulateDiscogs(
  collection: AnalysisResult[],
  updateItem: (id: string, updates: Partial<AnalysisResult>) => void,
  onProgress?: (progress: BackpopulateProgress) => void,
): Promise<{ enriched: number; failed: number; skipped: number }> {
  const needsEnrichment = collection.filter((item) => !item.discogsId);

  const total = needsEnrichment.length;
  let enriched = 0;
  let failed = 0;

  for (let i = 0; i < needsEnrichment.length; i++) {
    const item = needsEnrichment[i];

    onProgress?.({
      current: i + 1,
      total,
      enriched,
      failed,
      currentItem: item.name,
    });

    try {
      let discogs: DiscogsResult | null = null;

      if (item.barcode) {
        discogs = await searchByBarcode(item.barcode);
      }

      if (!discogs) {
        const query = buildQuery(item);
        if (query.length >= 3) {
          discogs = await searchByQuery(query);
        }
      }

      if (discogs) {
        updateItem(item.id, buildDiscogsUpdates(discogs));
        enriched++;
      } else {
        failed++;
      }
    } catch {
      failed++;
    }

    if (i < needsEnrichment.length - 1) {
      await sleep(RATE_LIMIT_MS);
    }
  }

  const skipped = collection.length - total;
  return { enriched, failed, skipped };
}
