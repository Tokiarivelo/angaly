import { useMemo } from 'react';

import type { PublicPageSectionDto } from '../api/collections-liste.api';
import { useCollectionsSectionsContentQuery } from '../api/collections-liste.api';

export interface CollectionsListeContent {
  header: { title: string; subtitle: string };
}

/**
 * Default editorial copy for the ANGALY "Nos Collections" header — the
 * fallback when the CMS (`GET /content/public/collections-liste`,
 * PUBLISHED-only, see docs/features/content.md) has no `header` row yet.
 * Mirrors the real Stitch "Nos Collections (Index Editorial)" screen — see
 * docs/pages/collections-liste.md. The breadcrumb stays hardcoded in
 * `CollectionsHeader.tsx` — it's structural navigation, not editorial content.
 */
const DEFAULT_COLLECTIONS_LISTE_CONTENT: CollectionsListeContent = {
  header: {
    title: 'Nos Collections',
    subtitle: 'Chaque collection raconte une histoire, une saison, une inspiration.',
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
 * Merges the PUBLISHED `PageSection` row (`page="collections-liste"`,
 * `sectionKey="header"`) onto `DEFAULT_COLLECTIONS_LISTE_CONTENT`. Absent
 * from the CMS response (never edited yet, or its only row still `DRAFT` —
 * the public endpoint never returns those) falls back entirely to the
 * hardcoded default; an individual null/missing field within a present
 * section also falls back to its own default field.
 */
function applyCmsSections(
  base: CollectionsListeContent,
  sections: PublicPageSectionDto[] | undefined,
): CollectionsListeContent {
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

export function useCollectionsContent(): {
  data: CollectionsListeContent;
  isLoading: boolean;
  error: Error | null;
} {
  const { data: sections, isLoading, error } = useCollectionsSectionsContentQuery();

  const data = useMemo(() => applyCmsSections(DEFAULT_COLLECTIONS_LISTE_CONTENT, sections), [sections]);

  return { data, isLoading, error };
}
