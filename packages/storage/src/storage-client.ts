import { randomUUID } from 'node:crypto';

import { Client as MinioClient } from 'minio';

import { ALL_STORAGE_BUCKETS, type StorageBucketName } from './buckets';

export interface StorageClientOptions {
  endPoint: string;
  port: number;
  useSSL: boolean;
  accessKey: string;
  secretKey: string;
  /** Public base URL used to build served image URLs (behind Caddy/Nginx in prod). */
  publicUrl: string;
}

export interface UploadResult {
  bucket: StorageBucketName;
  objectKey: string;
  url: string;
  sizeBytes: number;
}

/**
 * Thin wrapper around the MinIO S3 client. Never call the underlying `minio`
 * client directly outside this package — the `media` backend module is the
 * only consumer (see docs/features/media.md and .cursor/rules/009-storage-minio.mdc).
 */
export class StorageClient {
  private readonly client: MinioClient;
  private readonly publicUrl: string;

  constructor(options: StorageClientOptions) {
    this.client = new MinioClient({
      endPoint: options.endPoint,
      port: options.port,
      useSSL: options.useSSL,
      accessKey: options.accessKey,
      secretKey: options.secretKey,
    });
    this.publicUrl = options.publicUrl.replace(/\/$/, '');
  }

  /** Idempotently ensures every bucket in ALL_STORAGE_BUCKETS exists (called once at boot). */
  async ensureBuckets(): Promise<void> {
    for (const bucket of ALL_STORAGE_BUCKETS) {
      const exists = await this.client.bucketExists(bucket).catch(() => false);
      if (!exists) {
        await this.client.makeBucket(bucket);
      }
    }
  }

  buildPublicUrl(bucket: StorageBucketName, objectKey: string): string {
    return `${this.publicUrl}/${bucket}/${objectKey}`;
  }

  async uploadBuffer(
    bucket: StorageBucketName,
    buffer: Buffer,
    options: { originalFilename: string; mimeType: string; keyPrefix?: string },
  ): Promise<UploadResult> {
    const extension = options.originalFilename.split('.').pop() ?? 'bin';
    const objectKey = `${options.keyPrefix ? `${options.keyPrefix}/` : ''}${randomUUID()}.${extension}`;

    await this.client.putObject(bucket, objectKey, buffer, buffer.length, {
      'Content-Type': options.mimeType,
    });

    return {
      bucket,
      objectKey,
      url: this.buildPublicUrl(bucket, objectKey),
      sizeBytes: buffer.length,
    };
  }

  /** Presigned PUT URL so the browser can upload directly to MinIO (media library "Importer"). */
  async getPresignedUploadUrl(
    bucket: StorageBucketName,
    objectKey: string,
    expirySeconds = 600,
  ): Promise<string> {
    return this.client.presignedPutObject(bucket, objectKey, expirySeconds);
  }

  async deleteObject(bucket: StorageBucketName, objectKey: string): Promise<void> {
    await this.client.removeObject(bucket, objectKey);
  }
}
