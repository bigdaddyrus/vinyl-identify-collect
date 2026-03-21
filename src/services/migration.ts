import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAppStore } from '@/store/useAppStore';
import { upsertCollectionItem } from '@/services/api/collections';
import { syncPreferencesFromLocal } from '@/services/api/preferences';
import { uploadImage } from '@/services/api/images';
import { appConfig } from '@/config/appConfig';

const MIGRATION_KEY = `${appConfig.appSlug}-hasMigratedToCloud`;

/**
 * Check if local-to-cloud migration has already been completed.
 */
export async function hasMigrated(): Promise<boolean> {
  const value = await AsyncStorage.getItem(MIGRATION_KEY);
  return value === 'true';
}

/**
 * One-time migration of local Zustand state to Supabase.
 *
 * Steps:
 * 1. Read local Zustand state
 * 2. Upload collection images to Supabase Storage
 * 3. Upsert collection_items with client_item_id preserved
 * 4. Sync user_preferences from local boolean flags
 * 5. Set hasMigratedToCloud flag
 *
 * Safe to call multiple times — checks migration flag first.
 */
export async function migrateLocalToCloud(profileId: string): Promise<{
  itemsMigrated: number;
  imagesMigrated: number;
  errors: string[];
}> {
  if (await hasMigrated()) {
    return { itemsMigrated: 0, imagesMigrated: 0, errors: [] };
  }

  const state = useAppStore.getState();
  const errors: string[] = [];
  let itemsMigrated = 0;
  let imagesMigrated = 0;

  // 1. Sync preferences
  try {
    await syncPreferencesFromLocal(profileId, {
      hasCompletedOnboarding: state.hasCompletedOnboarding,
      hasSeenPaywall: state.hasSeenPaywall,
      hasSeenSnapTips: state.hasSeenSnapTips,
      hasTriggeredReview: state.hasTriggeredReview,
      scanCount: state.scanCount,
    });
  } catch (err) {
    errors.push(`Preferences sync failed: ${err}`);
  }

  // 2. Migrate collection items
  for (const item of state.collection) {
    try {
      // Upload image if it exists locally
      let imagePath: string | undefined;
      if (item.imageUri) {
        try {
          const { storagePath } = await uploadImage(
            profileId,
            item.imageUri,
            'scan_original'
          );
          imagePath = storagePath;
          imagesMigrated++;
        } catch (imgErr) {
          errors.push(`Image upload failed for "${item.name}": ${imgErr}`);
        }
      }

      // Upsert the collection item
      const itemWithPath = imagePath
        ? { ...item, imageUri: imagePath }
        : item;
      await upsertCollectionItem(profileId, itemWithPath);
      itemsMigrated++;
    } catch (err) {
      errors.push(`Item "${item.name}" migration failed: ${err}`);
    }
  }

  // 3. Mark migration complete (even with partial errors, don't re-run)
  await AsyncStorage.setItem(MIGRATION_KEY, 'true');

  console.log(
    `[Migration] Complete: ${itemsMigrated} items, ${imagesMigrated} images, ${errors.length} errors`
  );

  return { itemsMigrated, imagesMigrated, errors };
}
