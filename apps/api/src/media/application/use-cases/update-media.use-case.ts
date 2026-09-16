import { Inject, Injectable, NotFoundException } from '@nestjs/common';

import { MediaEntity } from '../../domain/entities/media.entity';
import {
  IMediaStorageGateway,
  MEDIA_STORAGE_GATEWAY,
} from '../../domain/repositories/media-storage.gateway';
import {
  IMediaRepository,
  MEDIA_REPOSITORY,
  MediaUpdateInput,
} from '../../domain/repositories/media.repository';

export interface UpdateMediaCommand {
  altText?: string;
  bucket?: string;
  objectKey?: string;
  mimeType?: string;
  sizeBytes?: number;
  width?: number;
  height?: number;
}

/**
 * Edits alt text and/or replaces the binary in place — always the same `id`
 * (docs/features/media.md). `url` is never accepted from the client: when
 * `bucket`/`objectKey` change (a replace), it is recomputed here via
 * `IMediaStorageGateway.buildPublicUrl()`, the same source of truth
 * `confirm-upload` uses.
 */
@Injectable()
export class UpdateMediaUseCase {
  constructor(
    @Inject(MEDIA_REPOSITORY) private readonly mediaRepository: IMediaRepository,
    @Inject(MEDIA_STORAGE_GATEWAY) private readonly storageGateway: IMediaStorageGateway,
  ) {}

  async execute(id: string, command: UpdateMediaCommand): Promise<MediaEntity> {
    const existing = await this.mediaRepository.findById(id);
    if (!existing) {
      throw new NotFoundException(`Media ${id} not found`);
    }

    const patch: MediaUpdateInput = { ...command };
    if (command.bucket || command.objectKey) {
      const bucket = command.bucket ?? existing.bucket;
      const objectKey = command.objectKey ?? existing.objectKey;
      patch.bucket = bucket;
      patch.objectKey = objectKey;
      patch.url = this.storageGateway.buildPublicUrl(bucket, objectKey);
    }

    return this.mediaRepository.update(id, patch);
  }
}
