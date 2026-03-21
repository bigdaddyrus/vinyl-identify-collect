import AsyncStorage from '@react-native-async-storage/async-storage';
import type { SyncOperation } from '@/types/database';
import { insertCollectionItem, deleteCollectionItem as apiDeleteCollectionItem, updateCollectionItem as apiUpdateCollectionItem } from '@/services/api/collections';
import { updatePreferences } from '@/services/api/preferences';
import { uploadImage } from '@/services/api/images';
import { appConfig } from '@/config/appConfig';
import type { AnalysisResult } from '@/types';

const SYNC_QUEUE_KEY = `${appConfig.appSlug}-sync-queue`;
const MAX_RETRIES = 5;

/**
 * Offline-first sync engine.
 * Queues operations when offline and replays them when connectivity returns.
 */

async function getQueue(): Promise<SyncOperation[]> {
  const raw = await AsyncStorage.getItem(SYNC_QUEUE_KEY);
  return raw ? JSON.parse(raw) : [];
}

async function saveQueue(queue: SyncOperation[]): Promise<void> {
  await AsyncStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(queue));
}

/**
 * Enqueue an operation for background sync.
 */
export async function enqueue(op: Omit<SyncOperation, 'id' | 'created_at' | 'retries'>): Promise<void> {
  const queue = await getQueue();
  queue.push({
    ...op,
    id: `sync-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
    created_at: Date.now(),
    retries: 0,
  });
  await saveQueue(queue);
}

/**
 * Process all queued sync operations.
 * Returns the number of successfully processed operations.
 */
export async function processQueue(profileId: string): Promise<number> {
  const queue = await getQueue();
  if (queue.length === 0) return 0;

  const failed: SyncOperation[] = [];
  let processed = 0;

  for (const op of queue) {
    try {
      await executeOperation(profileId, op);
      processed++;
    } catch (err) {
      console.warn('[SyncEngine] Operation failed:', op.type, err);
      if (op.retries < MAX_RETRIES) {
        failed.push({ ...op, retries: op.retries + 1 });
      } else {
        console.error('[SyncEngine] Dropping operation after max retries:', op.id);
      }
    }
  }

  await saveQueue(failed);
  return processed;
}

async function executeOperation(profileId: string, op: SyncOperation): Promise<void> {
  switch (op.type) {
    case 'upsert_collection_item': {
      const item = op.payload.item as AnalysisResult;
      await insertCollectionItem(profileId, item);
      break;
    }
    case 'delete_collection_item': {
      const itemId = op.payload.itemId as string;
      await apiDeleteCollectionItem(itemId);
      break;
    }
    case 'update_preferences': {
      const updates = op.payload.updates as Record<string, unknown>;
      await updatePreferences(profileId, updates);
      break;
    }
    case 'upload_image': {
      const { localUri, imageType, scanId, collectionItemId } = op.payload as {
        localUri: string;
        imageType: 'scan_original' | 'scan_cropped' | 'thumbnail';
        scanId?: string;
        collectionItemId?: string;
      };
      await uploadImage(profileId, localUri, imageType, scanId, collectionItemId);
      break;
    }
    default:
      console.warn('[SyncEngine] Unknown operation type:', op.type);
  }
}

/**
 * Get the number of pending sync operations.
 */
export async function getPendingCount(): Promise<number> {
  const queue = await getQueue();
  return queue.length;
}

/**
 * Clear the sync queue (use after successful full migration).
 */
export async function clearQueue(): Promise<void> {
  await AsyncStorage.removeItem(SYNC_QUEUE_KEY);
}
