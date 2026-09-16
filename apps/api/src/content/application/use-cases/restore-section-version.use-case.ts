import { Inject, Injectable, NotFoundException } from '@nestjs/common';

import { PageSectionEntity } from '../../domain/entities/page-section.entity';
import {
  IPageSectionRepository,
  PAGE_SECTION_REPOSITORY,
} from '../../domain/repositories/page-section.repository';

export interface RestoreSectionVersionInput {
  pageSectionId: string;
  versionId: string;
  actorId: string | null;
}

/** Restoring is itself a write: the pre-restore state is snapshotted first, so a restore can always be undone. */
@Injectable()
export class RestoreSectionVersionUseCase {
  constructor(
    @Inject(PAGE_SECTION_REPOSITORY) private readonly pageSectionRepository: IPageSectionRepository,
  ) {}

  async execute(input: RestoreSectionVersionInput): Promise<PageSectionEntity> {
    const version = await this.pageSectionRepository.findVersionById(input.pageSectionId, input.versionId);
    if (!version) {
      throw new NotFoundException(`Version ${input.versionId} not found for section ${input.pageSectionId}`);
    }

    return this.pageSectionRepository.restoreVersion(input.pageSectionId, input.versionId, input.actorId);
  }
}
