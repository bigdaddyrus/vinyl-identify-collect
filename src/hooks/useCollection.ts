import { useCallback } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { insertCollectionItem, deleteCollectionItem as apiDelete, updateCollectionItem as apiUpdate } from '@/services/api/collections';
import { enqueue } from '@/services/syncEngine';
import type { AnalysisResult } from '@/types';

/**
 * Hook for collection operations.
 * Writes to local Zustand store (UI source of truth) and
 * fires-and-forgets the Supabase sync. Falls back to sync queue on failure.
 */
export function useCollection(profileId: string | null) {
  const addToCollection = useAppStore((s) => s.addToCollection);
  const removeFromCollection = useAppStore((s) => s.removeFromCollection);
  const updateCollectionItem = useAppStore((s) => s.updateCollectionItem);

  const addItem = useCallback(
    async (item: AnalysisResult) => {
      // 1. Immediately update local store (UI source of truth)
      addToCollection(item);

      // 2. Sync to cloud in background
      if (profileId) {
        try {
          await insertCollectionItem(profileId, item);
        } catch (err) {
          console.warn('[useCollection] Cloud sync failed, queueing:', err);
          await enqueue({
            type: 'upsert_collection_item',
            payload: { item },
          });
        }
      }
    },
    [profileId, addToCollection]
  );

  const removeItem = useCallback(
    async (id: string) => {
      removeFromCollection(id);

      if (profileId) {
        try {
          await apiDelete(id);
        } catch (err) {
          console.warn('[useCollection] Cloud delete failed, queueing:', err);
          await enqueue({
            type: 'delete_collection_item',
            payload: { itemId: id },
          });
        }
      }
    },
    [profileId, removeFromCollection]
  );

  const updateItem = useCallback(
    async (id: string, updates: Partial<AnalysisResult>) => {
      updateCollectionItem(id, updates);

      if (profileId) {
        try {
          // Map AnalysisResult field names to DB column names
          const dbUpdates: Record<string, unknown> = {};
          if (updates.name !== undefined) dbUpdates.name = updates.name;
          if (updates.origin !== undefined) dbUpdates.origin = updates.origin;
          if (updates.year !== undefined) dbUpdates.year = updates.year;
          if (updates.estimatedValue !== undefined) dbUpdates.estimated_value = updates.estimatedValue;
          if (updates.description !== undefined) dbUpdates.description = updates.description;
          if (updates.rarity !== undefined) dbUpdates.rarity = updates.rarity;
          if (updates.condition !== undefined) dbUpdates.condition = updates.condition;
          if (updates.notes !== undefined) dbUpdates.user_notes = updates.notes;

          if (Object.keys(dbUpdates).length > 0) {
            await apiUpdate(id, dbUpdates);
          }
        } catch (err) {
          console.warn('[useCollection] Cloud update failed:', err);
        }
      }
    },
    [profileId, updateCollectionItem]
  );

  return { addItem, removeItem, updateItem };
}
