import { useMemo } from 'react';

import type { PublicPageSectionDto } from '../api/nos-creations-galerie.api';
import { useGallerySectionsContentQuery } from '../api/nos-creations-galerie.api';

export interface GalleryContent {
  header: { title: string; subtitle: string };
}

/**
 * Default editorial copy for the ANGALY "Nos Créations" gallery header — the
 * fallback when the CMS (`GET /content/public/nos-creations-galerie`,
 * PUBLISHED-only, see docs/features/content.md) has no `header` row yet.
 * Mirrors the real Stitch "Nos Créations (Gallery Portfolio)" screen — see
 * docs/pages/nos-creations-galerie.md. The breadcrumb stays hardcoded in
 * `GalleryHeader.tsx` — it's structural navigation, not editorial content.
 */
const DEFAULT_GALLERY_CONTENT: GalleryContent = {
  header: {
    title: 'Nos Créations',
    subtitle: "Explorez l'ensemble de notre savoir-faire, des robes de mariée aux costumes sur mesure.",
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
 * Merges the PUBLISHED `PageSection` row (`page="nos-creations-galerie"`,
 * `sectionKey="header"`) onto `DEFAULT_GALLERY_CONTENT`. Absent from the CMS
 * response (never edited yet, or its only row still `DRAFT` — the public
 * endpoint never returns those) falls back entirely to the hardcoded
 * default; an individual null/missing field within a present section also
 * falls back to its own default field.
 */
function applyCmsSections(base: GalleryContent, sections: PublicPageSectionDto[] | undefined): GalleryContent {
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

export function useGalleryContent(): { data: GalleryContent; isLoading: boolean; error: Error | null } {
  const { data: sections, isLoading, error } = useGallerySectionsContentQuery();

  const data = useMemo(() => applyCmsSections(DEFAULT_GALLERY_CONTENT, sections), [sections]);

  return { data, isLoading, error };
}
