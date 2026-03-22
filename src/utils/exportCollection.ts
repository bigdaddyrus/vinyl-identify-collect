import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { AnalysisResult } from '@/types';
import { appConfig } from '@/config/appConfig';

/**
 * Exports the collection as a JSON file and opens the system share sheet.
 * Sanitizes image URIs to keep only file:// paths (no base64 blobs).
 */
export async function exportCollectionAsJSON(items: AnalysisResult[]): Promise<void> {
  const sanitizeUri = (uri?: string): string | undefined => {
    if (!uri) return undefined;
    if (uri.startsWith('file://')) return uri;
    return undefined;
  };

  const sanitizedCollection = items.map((item) => ({
    ...item,
    imageUri: sanitizeUri(item.imageUri),
    images: item.images?.map(sanitizeUri).filter(Boolean),
  }));

  const totalValue = items.reduce((sum, item) => sum + (item.estimatedValue || 0), 0);

  const payload = {
    appName: appConfig.appName,
    exportedAt: new Date().toISOString(),
    itemCount: items.length,
    totalValue,
    collection: sanitizedCollection,
  };

  const json = JSON.stringify(payload, null, 2);
  const fileName = `${appConfig.appSlug}-collection-${Date.now()}.json`;
  const filePath = `${Paths.cache.uri}/${fileName}`;
  const file = new File(filePath);
  try {
    await file.write(json);
  } catch (writeError) {
    throw new Error(`Failed to write export file: ${String(writeError)}`);
  }

  const canShare = await Sharing.isAvailableAsync();
  if (!canShare) {
    throw new Error('Sharing is not available on this device.');
  }

  await Sharing.shareAsync(filePath, {
    mimeType: 'application/json',
    dialogTitle: 'Export Collection',
    UTI: 'public.json',
  });
}
