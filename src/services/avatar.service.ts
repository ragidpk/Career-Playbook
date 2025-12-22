import { supabase } from './supabase';

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const BUCKET_NAME = 'avatars';

export class AvatarUploadError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AvatarUploadError';
  }
}

export async function uploadAvatar(userId: string, file: File): Promise<string> {
  // Validate file size
  if (file.size > MAX_FILE_SIZE) {
    throw new AvatarUploadError('File size must be less than 2MB');
  }

  // Validate file type
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new AvatarUploadError('File must be JPEG, PNG, WebP, or GIF');
  }

  // Generate file path: {userId}/avatar.{ext}
  const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
  const filePath = `${userId}/avatar.${ext}`;

  // Delete existing avatar first (ignore errors if doesn't exist)
  await deleteAvatar(userId).catch(() => {});

  // Upload to Supabase Storage
  const { error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: true,
    });

  if (error) {
    console.error('Avatar upload error:', error.message, error);
    throw new AvatarUploadError(`Failed to upload avatar: ${error.message}`);
  }

  // Get public URL with cache-busting timestamp
  const { data: urlData } = supabase.storage
    .from(BUCKET_NAME)
    .getPublicUrl(filePath);

  return `${urlData.publicUrl}?t=${Date.now()}`;
}

export async function deleteAvatar(userId: string): Promise<void> {
  // List all files in user's folder
  const { data: files, error: listError } = await supabase.storage
    .from(BUCKET_NAME)
    .list(userId);

  if (listError) {
    console.error('Error listing avatars:', listError);
    return;
  }

  if (files && files.length > 0) {
    const filesToDelete = files.map((f) => `${userId}/${f.name}`);
    const { error: deleteError } = await supabase.storage
      .from(BUCKET_NAME)
      .remove(filesToDelete);

    if (deleteError) {
      console.error('Error deleting avatars:', deleteError);
    }
  }
}

export function getAvatarUrl(userId: string, fileName?: string): string {
  const filePath = fileName ? `${userId}/${fileName}` : `${userId}/avatar`;
  const { data } = supabase.storage.from(BUCKET_NAME).getPublicUrl(filePath);
  return data.publicUrl;
}
