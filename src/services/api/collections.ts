import { supabase } from '@/lib/supabase';
import { appConfig } from '@/config/appConfig';
import type { CollectionItemRow } from '@/types/database';
import type { AnalysisResult } from '@/types';

const APP_ID = appConfig.appSlug;

/**
 * Fetch all non-deleted collection items for the current user.
 */
export async function fetchCollectionItems(profileId: string): Promise<CollectionItemRow[]> {
  const { data, error } = await supabase
    .from('collection_items')
    .select('*')
    .eq('profile_id', profileId)
    .eq('app_id', APP_ID)
    .eq('is_deleted', false)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data ?? [];
}

/**
 * Convert a local AnalysisResult to a collection_items insert payload.
 */
function toInsertPayload(
  profileId: string,
  item: AnalysisResult,
  scanId?: string
): Omit<CollectionItemRow, 'id' | 'created_at' | 'updated_at'> {
  return {
    profile_id: profileId,
    app_id: APP_ID,
    scan_id: scanId ?? null,
    client_item_id: item.id,
    name: item.name,
    origin: item.origin ?? null,
    year: item.year ?? null,
    estimated_value: item.estimatedValue,
    confidence: item.confidence,
    description: item.description ?? null,
    rarity: item.rarity ?? null,
    condition: item.condition ?? null,
    extended_details: (item.extendedDetails as unknown as Record<string, unknown>[]) ?? null,
    image_path: item.imageUri ?? null,
    thumbnail_path: null,
    user_notes: item.notes ?? null,
    is_favorite: false,
    is_deleted: false,
    client_created_at: item.createdAt,
  };
}

/**
 * Insert a new collection item.
 */
export async function insertCollectionItem(
  profileId: string,
  item: AnalysisResult,
  scanId?: string
): Promise<CollectionItemRow> {
  const payload = toInsertPayload(profileId, item, scanId);

  const { data, error } = await supabase
    .from('collection_items')
    .insert(payload)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Upsert a collection item by client_item_id (for migration/sync).
 */
export async function upsertCollectionItem(
  profileId: string,
  item: AnalysisResult,
  scanId?: string
): Promise<CollectionItemRow> {
  const payload = toInsertPayload(profileId, item, scanId);

  const { data, error } = await supabase
    .from('collection_items')
    .upsert(payload, { onConflict: 'client_item_id' })
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Update a collection item (partial update).
 */
export async function updateCollectionItem(
  itemId: string,
  updates: Partial<Pick<CollectionItemRow, 'name' | 'origin' | 'year' | 'estimated_value' | 'description' | 'rarity' | 'condition' | 'user_notes' | 'is_favorite'>>
): Promise<CollectionItemRow> {
  const { data, error } = await supabase
    .from('collection_items')
    .update(updates)
    .eq('id', itemId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Soft-delete a collection item.
 */
export async function deleteCollectionItem(itemId: string): Promise<void> {
  const { error } = await supabase
    .from('collection_items')
    .update({ is_deleted: true })
    .eq('id', itemId);

  if (error) throw error;
}

/**
 * Get collection statistics via the DB function.
 */
export async function getCollectionStats(profileId: string) {
  const { data, error } = await supabase
    .rpc('get_collection_stats', {
      _profile_id: profileId,
      _app_id: APP_ID,
    })
    .single();

  if (error) throw error;
  return data;
}
