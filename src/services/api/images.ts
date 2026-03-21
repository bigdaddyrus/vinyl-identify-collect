import { supabase } from '@/lib/supabase';
import { appConfig } from '@/config/appConfig';
import { readAsStringAsync, EncodingType } from 'expo-file-system/legacy';
import { decode } from 'base64-arraybuffer';
import type { ImageRow } from '@/types/database';

const APP_ID = appConfig.appSlug;
const BUCKET = 'scan-images';

function getMimeType(uri: string): string {
  const ext = uri.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'png': return 'image/png';
    case 'webp': return 'image/webp';
    default: return 'image/jpeg';
  }
}

function getExtension(mimeType: string): string {
  switch (mimeType) {
    case 'image/png': return 'png';
    case 'image/webp': return 'webp';
    default: return 'jpg';
  }
}

/**
 * Upload an image to Supabase Storage and create a metadata record.
 * Path convention: {app_id}/{profile_id}/{type}/{filename}.{ext}
 */
export async function uploadImage(
  profileId: string,
  localUri: string,
  imageType: 'scan_original' | 'scan_cropped' | 'thumbnail',
  scanId?: string,
  collectionItemId?: string
): Promise<{ storagePath: string; imageRecord: ImageRow }> {
  const mimeType = getMimeType(localUri);
  const ext = getExtension(mimeType);
  const folder = imageType === 'scan_original' ? 'originals'
    : imageType === 'scan_cropped' ? 'cropped'
    : 'thumbnails';
  const filename = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${ext}`;
  const storagePath = `${APP_ID}/${profileId}/${folder}/${filename}`;

  // Read file as base64 and decode to ArrayBuffer
  const base64 = await readAsStringAsync(localUri, { encoding: EncodingType.Base64 });
  const arrayBuffer = decode(base64);

  // Upload to Storage
  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(storagePath, arrayBuffer, {
      contentType: mimeType,
      upsert: false,
    });

  if (uploadError) throw uploadError;

  // Create metadata record
  const { data, error } = await supabase
    .from('images')
    .insert({
      profile_id: profileId,
      app_id: APP_ID,
      bucket_id: BUCKET,
      storage_path: storagePath,
      mime_type: mimeType,
      file_size_bytes: base64.length * 0.75, // approximate decoded size
      image_type: imageType,
      scan_id: scanId ?? null,
      collection_item_id: collectionItemId ?? null,
    })
    .select()
    .single();

  if (error) throw error;
  return { storagePath, imageRecord: data };
}

/**
 * Get a signed URL to download/display an image (1 hour expiry).
 */
export async function getImageUrl(storagePath: string): Promise<string> {
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(storagePath, 3600);

  if (error) throw error;
  return data.signedUrl;
}

/**
 * Delete an image from Storage and its metadata record.
 */
export async function deleteImage(storagePath: string): Promise<void> {
  const { error: storageError } = await supabase.storage
    .from(BUCKET)
    .remove([storagePath]);

  if (storageError) throw storageError;

  const { error: dbError } = await supabase
    .from('images')
    .delete()
    .eq('storage_path', storagePath);

  if (dbError) throw dbError;
}
