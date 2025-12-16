import { S3Client } from '@aws-sdk/client-s3';

const region = import.meta.env.VITE_AWS_REGION;
const accessKeyId = import.meta.env.VITE_AWS_ACCESS_KEY_ID;
const secretAccessKey = import.meta.env.VITE_AWS_SECRET_ACCESS_KEY;

if (!region || !accessKeyId || !secretAccessKey) {
  console.warn('AWS S3 credentials not configured. File uploads will not work.');
}

export const s3Client = new S3Client({
  region: region || 'me-central-1',
  credentials: accessKeyId && secretAccessKey ? {
    accessKeyId,
    secretAccessKey,
  } : undefined,
});

export const AVATARS_BUCKET = import.meta.env.VITE_S3_AVATARS_BUCKET || 'career-playbook-avatars-prod';
export const RESUMES_BUCKET = import.meta.env.VITE_S3_RESUMES_BUCKET || 'career-playbook-resumes-prod';
export const AWS_REGION = region || 'me-central-1';
