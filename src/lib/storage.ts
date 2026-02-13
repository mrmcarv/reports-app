/**
 * File Storage Utility
 *
 * Abstraction layer for file uploads (photos, documents, etc.)
 *
 * DAY 1: Uses Supabase Storage (temporary, to unblock development)
 * DAY 2+: Switch to AWS S3 (production)
 *
 * To switch from Supabase to S3, only this file needs to change.
 * The rest of the app uses the same interface.
 */

import { createClient } from '@/lib/supabase/client';

/**
 * File upload result
 */
export interface UploadResult {
  url: string; // Public URL to access the file
  path: string; // Storage path (for reference/deletion)
}

/**
 * File validation constants
 */
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
export const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/heic',
];

/**
 * Validate file before upload
 *
 * @param file - File to validate
 * @throws Error if file is invalid
 */
export function validateFile(file: File): void {
  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    throw new Error(
      `File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB`
    );
  }

  // Check file type
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    throw new Error(
      `Invalid file type. Allowed types: ${ALLOWED_IMAGE_TYPES.join(', ')}`
    );
  }
}

/**
 * Generate unique filename with timestamp and random string
 *
 * @param originalName - Original filename
 * @returns Unique filename
 */
function generateUniqueFilename(originalName: string): string {
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 15);
  const extension = originalName.split('.').pop() || 'jpg';
  return `${timestamp}-${randomString}.${extension}`;
}

/**
 * Upload file to storage (Supabase Storage - Day 1)
 *
 * @param file - File to upload
 * @param folder - Optional folder path (e.g., "work-orders/12345")
 * @returns Upload result with public URL
 * @throws Error if upload fails
 */
export async function uploadFile(
  file: File,
  folder?: string
): Promise<UploadResult> {
  // Validate file
  validateFile(file);

  const supabase = createClient();

  // Generate unique filename
  const filename = generateUniqueFilename(file.name);
  const path = folder ? `${folder}/${filename}` : filename;

  console.log('📤 Uploading file:', path);

  try {
    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('work-order-photos')
      .upload(path, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      console.error('❌ Upload failed:', error);
      throw new Error(`Upload failed: ${error.message}`);
    }

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from('work-order-photos').getPublicUrl(path);

    console.log('✅ Upload successful:', publicUrl);

    return {
      url: publicUrl,
      path: data.path,
    };
  } catch (error) {
    console.error('❌ Upload error:', error);
    throw error;
  }
}

/**
 * Upload multiple files in parallel
 *
 * @param files - Array of files to upload
 * @param folder - Optional folder path
 * @returns Array of upload results
 */
export async function uploadFiles(
  files: File[],
  folder?: string
): Promise<UploadResult[]> {
  console.log(`📤 Uploading ${files.length} files...`);

  const uploadPromises = files.map((file) => uploadFile(file, folder));
  const results = await Promise.all(uploadPromises);

  console.log(`✅ Uploaded ${results.length} files`);

  return results;
}

/**
 * Delete file from storage
 *
 * @param path - Storage path of file to delete
 * @returns True if successful
 */
export async function deleteFile(path: string): Promise<boolean> {
  const supabase = createClient();

  console.log('🗑️  Deleting file:', path);

  try {
    const { error } = await supabase.storage
      .from('work-order-photos')
      .remove([path]);

    if (error) {
      console.error('❌ Delete failed:', error);
      throw new Error(`Delete failed: ${error.message}`);
    }

    console.log('✅ Delete successful');
    return true;
  } catch (error) {
    console.error('❌ Delete error:', error);
    throw error;
  }
}

/**
 * Get public URL for a file
 *
 * @param path - Storage path
 * @returns Public URL
 */
export function getPublicUrl(path: string): string {
  const supabase = createClient();

  const {
    data: { publicUrl },
  } = supabase.storage.from('work-order-photos').getPublicUrl(path);

  return publicUrl;
}

// ============================================================================
// DAY 2+: S3 IMPLEMENTATION (commented out for now)
// ============================================================================
/*
export async function uploadFile(
  file: File,
  folder?: string
): Promise<UploadResult> {
  // Validate file
  validateFile(file);

  // Generate unique filename
  const filename = generateUniqueFilename(file.name);
  const path = folder ? `${folder}/${filename}` : filename;

  console.log('📤 Uploading file to S3:', path);

  try {
    // Get presigned URL from API
    const response = await fetch('/api/upload/presigned-url', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fileName: filename,
        fileType: file.type,
        folder: folder,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to get presigned URL');
    }

    const { uploadUrl, publicUrl } = await response.json();

    // Upload directly to S3 using presigned URL
    const uploadResponse = await fetch(uploadUrl, {
      method: 'PUT',
      body: file,
      headers: {
        'Content-Type': file.type,
      },
    });

    if (!uploadResponse.ok) {
      throw new Error('Failed to upload to S3');
    }

    console.log('✅ Upload successful:', publicUrl);

    return {
      url: publicUrl,
      path: path,
    };
  } catch (error) {
    console.error('❌ Upload error:', error);
    throw error;
  }
}
*/
