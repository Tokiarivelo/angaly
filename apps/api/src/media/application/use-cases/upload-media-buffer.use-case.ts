import { randomUUID } from 'node:crypto';

import { Inject, Injectable } from '@nestjs/common';

import { MediaEntity } from '../../domain/entities/media.entity';
import {
  IMediaStorageGateway,
  MEDIA_STORAGE_GATEWAY,
} from '../../domain/repositories/media-storage.gateway';
import { IMediaRepository, MEDIA_REPOSITORY } from '../../domain/repositories/media.repository';
import { MediaEntityRef, resolveBucketForEntityType } from '../../domain/value-objects/media-entity-ref.vo';

export interface UploadMediaBufferInput {
  entityType: string;
  entityId?: string;
  altText: string;
  originalFilename: string;
  mimeType: string;
  buffer: Buffer;
  keyPrefix?: string;
  width?: number;
  height?: number;
  uploadedById?: string;
}

/** Server-side direct upload (small files, batch import) — see docs/features/media.md. */
@Injectable()
export class UploadMediaBufferUseCase {
  constructor(
    @Inject(MEDIA_REPOSITORY) private readonly mediaRepository: IMediaRepository,
    @Inject(MEDIA_STORAGE_GATEWAY) private readonly storageGateway: IMediaStorageGateway,
  ) {}

  async execute(input: UploadMediaBufferInput): Promise<MediaEntity> {
    const entityRef = MediaEntityRef.create(input.entityType, input.entityId ?? null);
    const bucket = resolveBucketForEntityType(entityRef.entityType);

    const { objectKey, sizeBytes } = await this.storageGateway.uploadBuffer(bucket, input.buffer, {
      originalFilename: input.originalFilename,
      mimeType: input.mimeType,
      keyPrefix: input.keyPrefix,
    });
    const url = this.storageGateway.buildPublicUrl(bucket, objectKey);

    const media = MediaEntity.create({
      id: randomUUID(),
      bucket,
      objectKey,
      url,
      altText: input.altText,
      mimeType: input.mimeType,
      sizeBytes,
      width: input.width ?? null,
      height: input.height ?? null,
      entityRef,
      sortOrder: 0,
      uploadedById: input.uploadedById ?? null,
      createdAt: new Date(),
    });

    return this.mediaRepository.create(media);
  }
}
