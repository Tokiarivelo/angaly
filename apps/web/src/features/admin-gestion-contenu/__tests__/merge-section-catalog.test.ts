import { describe, expect, it } from 'vitest';
import { ContentStatus, Locale } from '@angaly/types';

import { SECTION_CATALOG } from '../consts/section-catalog.const';
import { mergeSectionCatalog } from '../utils/merge-section-catalog';

const row = (sectionKey: string, status = ContentStatus.PUBLISHED) => ({
  sectionKey,
  status,
  updatedAt: '2026-01-01T00:00:00.000Z',
  locales: [Locale.FR],
});

describe('mergeSectionCatalog', () => {
  it('lists every catalogue page/section even when the database is empty (status null)', () => {
    const merged = mergeSectionCatalog([]);

    expect(merged.map((page) => page.page)).toEqual(SECTION_CATALOG.map((page) => page.page));
    expect(merged.flatMap((page) => page.sections).every((section) => section.status === null)).toBe(true);
  });

  it('overlays the stored status and locales onto the catalogue entry', () => {
    const merged = mergeSectionCatalog([{ page: 'accueil', sections: [row('hero', ContentStatus.DRAFT)] }]);
    const hero = merged.find((page) => page.page === 'accueil')!.sections.find((section) => section.sectionKey === 'hero')!;

    expect(hero).toMatchObject({ label: 'Bandeau principal', status: ContentStatus.DRAFT, locales: [Locale.FR] });
  });

  it('keeps database-only sections and pages the catalogue does not know', () => {
    const merged = mergeSectionCatalog([
      { page: 'accueil', sections: [row('footer')] },
      { page: 'nouvelle-page', sections: [row('intro')] },
    ]);

    expect(merged.find((page) => page.page === 'accueil')!.sections.at(-1)).toMatchObject({ sectionKey: 'footer', label: 'footer' });
    expect(merged.at(-1)).toMatchObject({ page: 'nouvelle-page', sections: [{ sectionKey: 'intro' }] });
  });
});
