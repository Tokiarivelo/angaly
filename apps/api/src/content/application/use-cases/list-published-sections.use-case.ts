import { Inject, Injectable } from '@nestjs/common';

import { PageSectionEntity } from '../../domain/entities/page-section.entity';
import {
  IPageSectionRepository,
  PAGE_SECTION_REPOSITORY,
} from '../../domain/repositories/page-section.repository';
import { BASE_LOCALE, localizeSection } from '../../domain/services/localize-section';
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

  /**
   * No locale: every published row (legacy behaviour). Base locale (FR): its rows only. Any other locale:
   * one entry per section — the translation layered over the FR base (untranslated fields fall back to FR,
   * images always come from FR), or the plain FR section when it has no published translation.
   */
  async execute(page: string, locale?: LocaleValue): Promise<PageSectionEntity[]> {
    if (!locale || locale === BASE_LOCALE) {
      return this.pageSectionRepository.findPublished(page, locale);
    }

    const rows = await this.pageSectionRepository.findPublished(page);
    const baseByKey = new Map(rows.filter((row) => row.locale === BASE_LOCALE).map((row) => [row.sectionKey, row]));
    const localizedByKey = new Map(rows.filter((row) => row.locale === locale).map((row) => [row.sectionKey, row]));

    return [...new Set([...baseByKey.keys(), ...localizedByKey.keys()])]
      .sort()
      .flatMap((sectionKey) => {
        const section = localizeSection(baseByKey.get(sectionKey), localizedByKey.get(sectionKey));
        return section ? [section] : [];
      });
  }
}
