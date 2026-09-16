import { Inject, Injectable } from '@nestjs/common';

import { PageSectionEntity } from '../../domain/entities/page-section.entity';
import {
  IPageSectionRepository,
  PAGE_SECTION_REPOSITORY,
} from '../../domain/repositories/page-section.repository';

/** Returns every existing locale row for a (page, sectionKey) — a locale with no row yet is simply absent, the editor treats it as an empty draft. */
@Injectable()
export class GetSectionUseCase {
  constructor(
    @Inject(PAGE_SECTION_REPOSITORY) private readonly pageSectionRepository: IPageSectionRepository,
  ) {}

  execute(page: string, sectionKey: string): Promise<PageSectionEntity[]> {
    return this.pageSectionRepository.findAllLocales(page, sectionKey);
  }
}
