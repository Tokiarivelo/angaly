import { Inject, Injectable } from '@nestjs/common';

import {
  IPageSectionRepository,
  PAGE_SECTION_REPOSITORY,
} from '../../domain/repositories/page-section.repository';
import { ContentStatusValue, LocaleValue } from '../../domain/value-objects/content-status.vo';

export interface SectionSummary {
  sectionKey: string;
  status: ContentStatusValue;
  updatedAt: Date;
  locales: LocaleValue[];
}

export interface PageSectionGroup {
  page: string;
  sections: SectionSummary[];
}

/** Groups the flat PageSection rows by `page`, then by `sectionKey` (one summary per locale set) — see docs/features/content.md. */
@Injectable()
export class ListSectionsUseCase {
  constructor(
    @Inject(PAGE_SECTION_REPOSITORY) private readonly pageSectionRepository: IPageSectionRepository,
  ) {}

  async execute(): Promise<PageSectionGroup[]> {
    const rows = await this.pageSectionRepository.listAll();

    const byPage = new Map<string, Map<string, SectionSummary>>();
    for (const row of rows) {
      if (!byPage.has(row.page)) {
        byPage.set(row.page, new Map());
      }
      const sections = byPage.get(row.page)!;
      const existing = sections.get(row.sectionKey);

      if (!existing) {
        sections.set(row.sectionKey, {
          sectionKey: row.sectionKey,
          status: row.status,
          updatedAt: row.updatedAt,
          locales: [row.locale],
        });
        continue;
      }

      existing.locales.push(row.locale);
      if (row.updatedAt > existing.updatedAt) {
        existing.updatedAt = row.updatedAt;
      }
      // FR is the canonical status for the summary pill when both locales exist.
      if (row.locale === 'FR') {
        existing.status = row.status;
      }
    }

    return Array.from(byPage.entries()).map(([page, sections]) => ({
      page,
      sections: Array.from(sections.values()),
    }));
  }
}
