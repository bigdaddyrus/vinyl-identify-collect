import { supabase } from '@/lib/supabase';
import { appConfig } from '@/config/appConfig';
import type { ScanRow } from '@/types/database';

const APP_ID = appConfig.appSlug;

/**
 * Create a new scan record (status = 'pending').
 */
export async function createScan(
  profileId: string,
  params: {
    clientScanId: string;
    imageSource: 'camera' | 'gallery';
    originalImagePath?: string;
  }
): Promise<ScanRow> {
  const { data, error } = await supabase
    .from('scans')
    .insert({
      profile_id: profileId,
      app_id: APP_ID,
      client_scan_id: params.clientScanId,
      image_source: params.imageSource,
      original_image_path: params.originalImagePath ?? null,
      status: 'pending',
      client_created_at: Date.now(),
      ai_model_used: null,
      ai_result: null,
      ai_latency_ms: null,
      ai_confidence: null,
      saved_to_collection: false,
      collection_item_id: null,
      cropped_image_path: null,
      completed_at: null,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Mark a scan as completed with AI results.
 */
export async function completeScan(
  scanId: string,
  result: {
    aiResult: Record<string, unknown>;
    aiModelUsed: string;
    aiLatencyMs: number;
    aiConfidence: number;
  }
): Promise<void> {
  const { error } = await supabase
    .from('scans')
    .update({
      status: 'completed',
      ai_result: result.aiResult,
      ai_model_used: result.aiModelUsed,
      ai_latency_ms: result.aiLatencyMs,
      ai_confidence: result.aiConfidence,
      completed_at: new Date().toISOString(),
    })
    .eq('id', scanId);

  if (error) throw error;
}

/**
 * Mark a scan as failed.
 */
export async function failScan(scanId: string): Promise<void> {
  const { error } = await supabase
    .from('scans')
    .update({ status: 'failed', completed_at: new Date().toISOString() })
    .eq('id', scanId);

  if (error) throw error;
}

/**
 * Link a scan to a collection item (when user saves to collection).
 */
export async function linkScanToCollection(
  scanId: string,
  collectionItemId: string
): Promise<void> {
  const { error } = await supabase
    .from('scans')
    .update({
      saved_to_collection: true,
      collection_item_id: collectionItemId,
    })
    .eq('id', scanId);

  if (error) throw error;
}

/**
 * Fetch scan history for the current user.
 */
export async function fetchScans(profileId: string): Promise<ScanRow[]> {
  const { data, error } = await supabase
    .from('scans')
    .select('*')
    .eq('profile_id', profileId)
    .eq('app_id', APP_ID)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data ?? [];
}
