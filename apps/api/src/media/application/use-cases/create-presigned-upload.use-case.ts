import { randomUUID } from 'node:crypto';

import { Inject, Injectable } from '@nestjs/common';

import {
  IMediaStorageGateway,
  MEDIA_STORAGE_GATEWAY,
} from '../../domain/repositories/media-storage.gateway';
import { MediaEntityRef, resolveBucketForEntityType } from '../../domain/value-objects/media-entity-ref.vo';
import { buildObjectKey } from '../../domain/value-objects/media-object-key.vo';

export interface CreatePresignedUploadInput {
  entityType: string;
  originalFilename: string;
  mimeType: string;
  keyPrefix?: string;
}

export interface CreatePresignedUploadOutput {
  bucket: string;
  objectKey: string;
  uploadUrl: string;
  expiresInSeconds: number;
}

@Injectable()
export class CreatePresignedUploadUseCase {
  constructor(
    @Inject(MEDIA_STORAGE_GATEWAY) private readonly storageGateway: IMediaStorageGateway,
  ) {}

  async execute(input: CreatePresignedUploadInput): Promise<CreatePresignedUploadOutput> {
    const entityRef = MediaEntityRef.create(input.entityType, null);
    const bucket = resolveBucketForEntityType(entityRef.entityType);
    const objectKey = buildObjectKey(input.originalFilename, randomUUID(), input.keyPrefix);

    const { uploadUrl, expiresInSeconds } = await this.storageGateway.createPresignedUploadUrl(
      bucket,
      objectKey,
    );

    return { bucket, objectKey, uploadUrl, expiresInSeconds };
  }
}
