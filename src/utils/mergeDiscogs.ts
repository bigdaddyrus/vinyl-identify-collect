import type { AnalysisResult } from '@/types';
import type { DiscogsResult } from '@/services/discogs';

/** Build a Partial<AnalysisResult> from Discogs data for use with updateCollectionItem */
export function buildDiscogsUpdates(discogs: DiscogsResult): Partial<AnalysisResult> {
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
