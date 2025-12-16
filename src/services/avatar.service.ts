import {
  PutObjectCommand,
  DeleteObjectsCommand,
  ListObjectsV2Command,
} from '@aws-sdk/client-s3';
import { s3Client, AVATARS_BUCKET, AWS_REGION } from '../lib/s3';

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

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

  // Generate S3 key: {userId}/avatar.{ext}
  const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
  const key = `${userId}/avatar.${ext}`;

  // Delete existing avatar first (ignore errors if doesn't exist)
  await deleteAvatar(userId).catch(() => {});

  // Convert File to ArrayBuffer
  const arrayBuffer = await file.arrayBuffer();

  // Upload to S3
  const command = new PutObjectCommand({
    Bucket: AVATARS_BUCKET,
    Key: key,
    Body: new Uint8Array(arrayBuffer),
    ContentType: file.type,
    CacheControl: 'max-age=3600',
  });

  try {
    await s3Client.send(command);
  } catch (error) {
    console.error('Avatar upload error:', error);
    throw new AvatarUploadError('Failed to upload avatar. Please try again.');
  }

  // Return public URL with cache-busting timestamp
  const publicUrl = `https://${AVATARS_BUCKET}.s3.${AWS_REGION}.amazonaws.com/${key}?t=${Date.now()}`;
  return publicUrl;
}

export async function deleteAvatar(userId: string): Promise<void> {
  // List all objects in user's folder
  const listCommand = new ListObjectsV2Command({
    Bucket: AVATARS_BUCKET,
    Prefix: `${userId}/`,
  });

  try {
    const listResponse = await s3Client.send(listCommand);
    const objects = listResponse.Contents || [];

    if (objects.length > 0) {
      const deleteCommand = new DeleteObjectsCommand({
        Bucket: AVATARS_BUCKET,
        Delete: {
          Objects: objects.map((obj) => ({ Key: obj.Key })),
        },
      });
      await s3Client.send(deleteCommand);
    }
  } catch (error) {
    console.error('Error deleting avatars:', error);
  }
}

export function getAvatarUrl(userId: string, fileName?: string): string {
  const key = fileName ? `${userId}/${fileName}` : `${userId}/avatar`;
  return `https://${AVATARS_BUCKET}.s3.${AWS_REGION}.amazonaws.com/${key}`;
}
