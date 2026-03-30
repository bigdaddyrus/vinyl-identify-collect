import { searchByBarcode, searchByQuery } from './discogs';
import type { DiscogsResult } from './discogs';
import { AnalysisResult } from '@/types';

const RATE_LIMIT_MS = 1200; // ~50 requests/min to stay within Discogs limits

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Extract a search query from an item name (e.g. "Artist — Album Title (edition)" → "Artist Album Title") */
function buildQuery(item: AnalysisResult): string {
  // Remove parenthetical edition info, en-dash separator, and extra whitespace
  return item.name
    .replace(/\s*[—–-]\s*/g, ' ')       // replace dashes with space
    .replace(/\([^)]*\)/g, '')           // remove parentheticals
    .replace(/\s+/g, ' ')
    .trim();
}

/** Merge Discogs data into an AnalysisResult, returning the partial update */
function buildUpdates(discogs: DiscogsResult): Partial<AnalysisResult> {
  const updates: Partial<AnalysisResult> = {};

  if (discogs.thumbnail) updates.discogsThumbnail = discogs.thumbnail;
  if (discogs.primaryImage) updates.discogsImage = discogs.primaryImage;
  if (discogs.discogsImages.length > 0) updates.discogsImages = discogs.discogsImages;
  if (discogs.styles.length > 0) updates.styles = discogs.styles;
  if (discogs.weight) updates.weight = discogs.weight;
  if (discogs.tracklist.length > 0) updates.discogsTracklist = discogs.tracklist;
  if (discogs.companies.length > 0) updates.companies = discogs.companies;
  if (discogs.extraArtists.length > 0) updates.extraArtists = discogs.extraArtists;
  if (discogs.discogsUrl) updates.discogsUrl = discogs.discogsUrl;
  if (discogs.discogsId) updates.discogsId = discogs.discogsId;
  if (discogs.lowestPrice != null) updates.lowestPrice = discogs.lowestPrice;
  if (discogs.numForSale != null) updates.numForSale = discogs.numForSale;
  if (discogs.community) {
    updates.communityHave = discogs.community.have;
    updates.communityWant = discogs.community.want;
  }

  return updates;
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
  // Filter items that don't have Discogs data yet
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

      // Try barcode first if available
      if (item.barcode) {
        discogs = await searchByBarcode(item.barcode);
      }

      // Fall back to name-based search
      if (!discogs) {
        const query = buildQuery(item);
        if (query.length >= 3) {
          discogs = await searchByQuery(query);
        }
      }

      if (discogs) {
        const updates = buildUpdates(discogs);
        updateItem(item.id, updates);
        enriched++;
      } else {
        failed++;
      }
    } catch {
      failed++;
    }

    // Rate limit between requests
    if (i < needsEnrichment.length - 1) {
      await sleep(RATE_LIMIT_MS);
    }
  }

  const skipped = collection.length - total;
  return { enriched, failed, skipped };
}
