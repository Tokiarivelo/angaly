import type { ContentStatus, Locale } from '@angaly/types';

import type { PageSectionGroupDto } from '../api/page-sections.api';
import { SECTION_CATALOG } from '../consts/section-catalog.const';

export interface CatalogSectionEntry {
  sectionKey: string;
  label: string;
  /** `null` when the section is defined in the catalogue but has no row in the database yet. */
  status: ContentStatus | null;
  locales: Locale[];
  updatedAt: string | null;
}

export interface CatalogPageEntry {
  page: string;
  label: string;
  sections: CatalogSectionEntry[];
}

/**
 * Union of the editorial catalogue and the rows that actually exist: every catalogue section is listed
 * (even before it is first saved), plus any database-only section the catalogue doesn't know about.
 * Catalogue order first, then unknown pages/sections alphabetically.
 */
export function mergeSectionCatalog(groups: readonly PageSectionGroupDto[]): CatalogPageEntry[] {
  const groupByPage = new Map(groups.map((group) => [group.page, group]));
  const result: CatalogPageEntry[] = [];

  for (const definition of SECTION_CATALOG) {
    const rows = new Map((groupByPage.get(definition.page)?.sections ?? []).map((section) => [section.sectionKey, section]));
    const sections: CatalogSectionEntry[] = definition.sections.map((section) => {
      const row = rows.get(section.sectionKey);
      rows.delete(section.sectionKey);
      return {
        sectionKey: section.sectionKey,
        label: section.label,
        status: row?.status ?? null,
        locales: row?.locales ?? [],
        updatedAt: row?.updatedAt ?? null,
      };
    });
    for (const row of [...rows.values()].sort((a, b) => a.sectionKey.localeCompare(b.sectionKey))) {
      sections.push({ sectionKey: row.sectionKey, label: row.sectionKey, status: row.status, locales: row.locales, updatedAt: row.updatedAt });
    }
    result.push({ page: definition.page, label: definition.label, sections });
    groupByPage.delete(definition.page);
  }

  for (const group of [...groupByPage.values()].sort((a, b) => a.page.localeCompare(b.page))) {
    result.push({
      page: group.page,
      label: group.page,
      sections: group.sections.map((section) => ({
        sectionKey: section.sectionKey,
        label: section.sectionKey,
        status: section.status,
        locales: section.locales,
        updatedAt: section.updatedAt,
      })),
    });
  }

  return result;
}
