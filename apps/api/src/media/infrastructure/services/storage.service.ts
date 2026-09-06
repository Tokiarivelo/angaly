import { Injectable } from '@nestjs/common';
import {
  createStorageClientFromEnv,
  StorageClient,
  StorageBucketName,
} from '@angaly/storage';

import {
  BufferUploadResult,
  IMediaStorageGateway,
  PresignedUploadResult,
} from '../../domain/repositories/media-storage.gateway';

const DEFAULT_PRESIGNED_EXPIRY_SECONDS = 600;

/**
 * Only point of contact with `@angaly/storage` in `apps/api`
 * (.cursor/rules/009-storage-minio.mdc) — implements the Domain's storage port.
 */
@Injectable()
export class StorageService implements IMediaStorageGateway {
  private readonly client: StorageClient = createStorageClientFromEnv();

  async createPresignedUploadUrl(
    bucket: string,
    objectKey: string,
    expiresInSeconds = DEFAULT_PRESIGNED_EXPIRY_SECONDS,
  ): Promise<PresignedUploadResult> {
    const uploadUrl = await this.client.getPresignedUploadUrl(
      bucket as StorageBucketName,
      objectKey,
      expiresInSeconds,
    );
    return { uploadUrl, expiresInSeconds };
  }

  async uploadBuffer(
    bucket: string,
    buffer: Buffer,
    options: { originalFilename: string; mimeType: string; keyPrefix?: string },
  ): Promise<BufferUploadResult> {
    const result = await this.client.uploadBuffer(bucket as StorageBucketName, buffer, options);
    return { objectKey: result.objectKey, sizeBytes: result.sizeBytes };
  }

  buildPublicUrl(bucket: string, objectKey: string): string {
    return this.client.buildPublicUrl(bucket as StorageBucketName, objectKey);
  }

  async deleteObject(bucket: string, objectKey: string): Promise<void> {
    await this.client.deleteObject(bucket as StorageBucketName, objectKey);
  }
}
