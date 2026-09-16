import { useMemo } from 'react';

import type { PublicPageSectionDto } from '../api/nos-ateliers-liste.api';
import { useAteliersListeSectionsContentQuery } from '../api/nos-ateliers-liste.api';

export interface AteliersListeContent {
  header: { title: string; subtitle: string };
}

/**
 * Default editorial copy for the ANGALY "Nos Ateliers" header — the
 * fallback when the CMS (`GET /content/public/nos-ateliers-liste`,
 * PUBLISHED-only, see docs/features/content.md) has no `header` row yet.
 * Mirrors the real Stitch "Nos Ateliers (Workshops & Locations)" screen —
 * see docs/pages/nos-ateliers-liste.md.
 */
const DEFAULT_ATELIERS_LISTE_CONTENT: AteliersListeContent = {
  header: {
    title: 'Nos Ateliers',
    subtitle: "Venez découvrir notre savoir-faire dans l'un de nos ateliers.",
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
 * Merges the PUBLISHED `PageSection` row (`page="nos-ateliers-liste"`,
 * `sectionKey="header"`) onto `DEFAULT_ATELIERS_LISTE_CONTENT`. Absent
 * from the CMS response (never edited yet, or its only row still `DRAFT` —
 * the public endpoint never returns those) falls back entirely to the
 * hardcoded default; an individual null/missing field within a present
 * section also falls back to its own default field.
 */
function applyCmsSections(
  base: AteliersListeContent,
  sections: PublicPageSectionDto[] | undefined,
): AteliersListeContent {
  const header = sectionsByKey(sections).get('header');

  return {
    ...base,
    header: {
      ...base.header,
      title: header?.titleText ?? base.header.title,
      subtitle: header?.subtitleText ?? base.header.subtitle,
    },
  };
}

export function useAteliersListeContent(): {
  data: AteliersListeContent;
  isLoading: boolean;
  error: Error | null;
} {
  const { data: sections, isLoading, error } = useAteliersListeSectionsContentQuery();

  const data = useMemo(() => applyCmsSections(DEFAULT_ATELIERS_LISTE_CONTENT, sections), [sections]);

  return { data, isLoading, error };
}
