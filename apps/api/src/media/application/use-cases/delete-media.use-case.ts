import { ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common';

import {
  IMediaStorageGateway,
  MEDIA_STORAGE_GATEWAY,
} from '../../domain/repositories/media-storage.gateway';
import { IMediaRepository, MEDIA_REPOSITORY } from '../../domain/repositories/media.repository';

/** Never delete a MinIO object still referenced by a polymorphic relation (docs/features/media.md). */
@Injectable()
export class DeleteMediaUseCase {
  constructor(
    @Inject(MEDIA_REPOSITORY) private readonly mediaRepository: IMediaRepository,
    @Inject(MEDIA_STORAGE_GATEWAY) private readonly storageGateway: IMediaStorageGateway,
  ) {}

  async execute(id: string): Promise<void> {
    const media = await this.mediaRepository.findById(id);
    if (!media) {
      throw new NotFoundException(`Media ${id} not found`);
    }

    const referenceCount = await this.mediaRepository.countActiveReferences(id);
    if (referenceCount > 0) {
      throw new ConflictException(`Media ${id} is still referenced and cannot be deleted`);
    }

    await this.storageGateway.deleteObject(media.bucket, media.objectKey);
    await this.mediaRepository.delete(id);
  }
}
