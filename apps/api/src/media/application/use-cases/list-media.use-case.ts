import { Inject, Injectable } from '@nestjs/common';

import {
  IMediaRepository,
  MEDIA_REPOSITORY,
  MediaListFilter,
  MediaListResult,
} from '../../domain/repositories/media.repository';

@Injectable()
export class ListMediaUseCase {
  constructor(@Inject(MEDIA_REPOSITORY) private readonly mediaRepository: IMediaRepository) {}

  execute(filter: MediaListFilter): Promise<MediaListResult> {
    return this.mediaRepository.list(filter);
  }
}
