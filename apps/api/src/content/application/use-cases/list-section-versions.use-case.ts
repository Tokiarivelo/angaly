import { Inject, Injectable } from '@nestjs/common';

import { PageSectionVersionEntity } from '../../domain/entities/page-section-version.entity';
import {
  IPageSectionRepository,
  PAGE_SECTION_REPOSITORY,
} from '../../domain/repositories/page-section.repository';

@Injectable()
export class ListSectionVersionsUseCase {
  constructor(
    @Inject(PAGE_SECTION_REPOSITORY) private readonly pageSectionRepository: IPageSectionRepository,
  ) {}

  execute(pageSectionId: string): Promise<PageSectionVersionEntity[]> {
    return this.pageSectionRepository.listVersions(pageSectionId);
  }
}
