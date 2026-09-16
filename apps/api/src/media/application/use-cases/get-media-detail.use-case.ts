import { Inject, Injectable, NotFoundException } from '@nestjs/common';

import { MediaEntity } from '../../domain/entities/media.entity';
import {
  IMediaRepository,
  MEDIA_REPOSITORY,
  MediaUsageRef,
} from '../../domain/repositories/media.repository';

export interface MediaDetail {
  media: MediaEntity;
  usedIn: MediaUsageRef[];
}

/** Powers the "Utilisée dans" panel of admin-mediatheque — real references, not just a count. */
@Injectable()
export class GetMediaDetailUseCase {
  constructor(@Inject(MEDIA_REPOSITORY) private readonly mediaRepository: IMediaRepository) {}

  async execute(id: string): Promise<MediaDetail> {
    const media = await this.mediaRepository.findById(id);
    if (!media) {
      throw new NotFoundException(`Media ${id} not found`);
    }

    const usedIn = await this.mediaRepository.findUsages(id);
    return { media, usedIn };
  }
}
