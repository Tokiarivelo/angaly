import { Inject, Injectable } from '@nestjs/common';

import { PageSectionEntity } from '../../domain/entities/page-section.entity';
import {
  IPageSectionRepository,
  PAGE_SECTION_REPOSITORY,
} from '../../domain/repositories/page-section.repository';
import { LocaleValue } from '../../domain/value-objects/content-status.vo';

/**
 * Public (unauthenticated) read path — the only use-case in this module
 * allowed to back a route with no `@Roles()` guard. Delegates to
 * `findPublished`, which is scoped to `status: PUBLISHED` at the repository
 * level, never to `listAll`/`findAllLocales` (those also return DRAFT rows).
 */
@Injectable()
export class ListPublishedSectionsUseCase {
  constructor(
    @Inject(PAGE_SECTION_REPOSITORY) private readonly pageSectionRepository: IPageSectionRepository,
  ) {}

  execute(page: string, locale?: LocaleValue): Promise<PageSectionEntity[]> {
    return this.pageSectionRepository.findPublished(page, locale);
  }
}
