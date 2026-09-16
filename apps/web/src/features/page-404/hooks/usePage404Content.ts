import { useMemo } from 'react';

import type { PublicPageSectionDto } from '../api/page-404.api';
import { usePage404SectionsContentQuery } from '../api/page-404.api';

export interface Page404Content {
  main: { title: string; subtitle: string };
}

/**
 * Default editorial copy for the ANGALY "Page non trouvée (404)" screen —
 * the fallback when the CMS (`GET /content/public/page-404`,
 * PUBLISHED-only, see docs/features/content.md) has no `main` row yet.
 * Mirrors the real Stitch "404 Page" screen — see docs/pages/page-404.md.
 */
const DEFAULT_PAGE_404_CONTENT: Page404Content = {
  main: {
    title: "Cette création semble avoir disparu de l'atelier...",
    subtitle: "La page que vous cherchez n'existe plus ou a été déplacée.",
  },
};

function sectionsByKey(sections: PublicPageSectionDto[] | undefined): Map<string, PublicPageSectionDto> {
  const map = new Map<string, PublicPageSectionDto>();
  for (const section of sections ?? []) {
    map.set(section.sectionKey, section);
  }
  return map;
}

/**
 * Merges the PUBLISHED `PageSection` row (`page="page-404"`,
 * `sectionKey="main"`) onto `DEFAULT_PAGE_404_CONTENT`. Absent from the CMS
 * response (never edited yet, or its only row still `DRAFT` — the public
 * endpoint never returns those) falls back entirely to the hardcoded
 * default; an individual null/missing field within a present section also
 * falls back to its own default field.
 */
function applyCmsSections(base: Page404Content, sections: PublicPageSectionDto[] | undefined): Page404Content {
  const main = sectionsByKey(sections).get('main');

  return {
    ...base,
    main: {
      ...base.main,
      title: main?.titleText ?? base.main.title,
      subtitle: main?.subtitleText ?? base.main.subtitle,
    },
  };
}

export function usePage404Content(): {
  data: Page404Content;
  isLoading: boolean;
  error: Error | null;
} {
  const { data: sections, isLoading, error } = usePage404SectionsContentQuery();

  const data = useMemo(() => applyCmsSections(DEFAULT_PAGE_404_CONTENT, sections), [sections]);

  return { data, isLoading, error };
}
