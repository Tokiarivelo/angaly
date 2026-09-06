import { randomUUID } from 'node:crypto';

import { Inject, Injectable } from '@nestjs/common';

import { MediaEntity } from '../../domain/entities/media.entity';
import {
  IMediaStorageGateway,
  MEDIA_STORAGE_GATEWAY,
} from '../../domain/repositories/media-storage.gateway';
import { IMediaRepository, MEDIA_REPOSITORY } from '../../domain/repositories/media.repository';
import { MediaEntityRef } from '../../domain/value-objects/media-entity-ref.vo';

export interface ConfirmUploadInput {
  bucket: string;
  objectKey: string;
  entityType: string;
  entityId?: string;
  altText: string;
  mimeType: string;
  sizeBytes: number;
  width?: number;
  height?: number;
  uploadedById?: string;
}

@Injectable()
export class ConfirmUploadUseCase {
  constructor(
    @Inject(MEDIA_REPOSITORY) private readonly mediaRepository: IMediaRepository,
    @Inject(MEDIA_STORAGE_GATEWAY) private readonly storageGateway: IMediaStorageGateway,
  ) {}

  async execute(input: ConfirmUploadInput): Promise<MediaEntity> {
    const entityRef = MediaEntityRef.create(input.entityType, input.entityId ?? null);
    const url = this.storageGateway.buildPublicUrl(input.bucket, input.objectKey);

    const media = MediaEntity.create({
      id: randomUUID(),
      bucket: input.bucket,
      objectKey: input.objectKey,
      url,
      altText: input.altText,
      mimeType: input.mimeType,
      sizeBytes: input.sizeBytes,
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
