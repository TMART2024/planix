import { S3Client } from '@aws-sdk/client-s3';
import { env } from './env.js';

/**
 * Garage object storage client. Garage is S3-compatible, so the AWS S3 SDK
 * connects identically — only the endpoint and forcePathStyle differ.
 * See docs/ARCHITECTURE.md "Garage Configuration".
 */
export const storageClient = new S3Client({
  endpoint: env.storage.endpoint,
  region: env.storage.region, // Garage accepts any region string
  credentials: {
    accessKeyId: env.storage.accessKey,
    secretAccessKey: env.storage.secretKey,
  },
  forcePathStyle: true, // required for Garage
});

/** Logical buckets provisioned during deploy (see ARCHITECTURE.md). */
export const buckets = {
  attachments: 'planix-attachments',
  reports: 'planix-reports',
  logos: 'planix-logos',
  photos: 'planix-photos',
} as const;
