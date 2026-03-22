import { File, Paths } from 'expo-file-system';
import { readAsStringAsync, writeAsStringAsync, EncodingType } from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import JSZip from 'jszip';
import { AnalysisResult } from '@/types';
import { appConfig } from '@/config/appConfig';

/**
 * Exports the collection as a JSON file and opens the system share sheet.
 * Sanitizes image URIs to keep only file:// paths (no base64 blobs).
 * Injects `discogs_query` into each item for downstream scraping.
 */
export async function exportCollectionAsJSON(items: AnalysisResult[]): Promise<void> {
  const sanitizeUri = (uri?: string): string | undefined => {
    if (!uri) return undefined;
    if (uri.startsWith('file://')) return uri;
    return undefined;
  };

  const sanitizedCollection = items.map((item) => ({
    ...item,
    discogs_query: `${item.origin} - ${item.name} - ${item.year}`,
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

/**
 * Exports all collection images as a ZIP file.
 * Each item gets a folder named after its id.
 * Missing or corrupted images are skipped with a console warning.
 */
export async function exportImageAssetsZip(
  items: AnalysisResult[],
  onProgress?: (current: number, total: number) => void,
): Promise<void> {
  const zip = new JSZip();

  // Count total images first for progress reporting
  let totalImages = 0;
  for (const item of items) {
    if (item.images?.length) {
      totalImages += item.images.filter((u) => u?.startsWith('file://')).length;
    } else if (item.imageUri?.startsWith('file://')) {
      totalImages += 1;
    }
  }

  let processed = 0;
  onProgress?.(0, totalImages);

  for (const item of items) {
    const uris: string[] = [];
    if (item.images?.length) {
      uris.push(...item.images);
    } else if (item.imageUri) {
      uris.push(item.imageUri);
    }

    if (uris.length === 0) continue;

    const folder = zip.folder(item.id)!;

    for (let index = 0; index < uris.length; index++) {
      const uri = uris[index];
      if (!uri || !uri.startsWith('file://')) continue;

      try {
        const base64Data = await readAsStringAsync(uri, {
          encoding: EncodingType.Base64,
        });
        folder.file(`image_${index}.jpg`, base64Data, { base64: true });
      } catch (err) {
        console.warn(`[ExportZip] Failed to read image for ${item.id} (index ${index}):`, err);
      }

      processed++;
      onProgress?.(processed, totalImages);
    }
  }

  onProgress?.(totalImages, totalImages);
  const base64Zip = await zip.generateAsync({ type: 'base64' });
  const zipFileName = 'VinylImages.zip';
  const zipPath = `${Paths.document.uri}/${zipFileName}`;
  await writeAsStringAsync(zipPath, base64Zip, { encoding: EncodingType.Base64 });

  const canShare = await Sharing.isAvailableAsync();
  if (!canShare) {
    throw new Error('Sharing is not available on this device.');
  }

  await Sharing.shareAsync(zipPath, {
    mimeType: 'application/zip',
    dialogTitle: 'Export Images',
    UTI: 'com.pkware.zip-archive',
  });
}
