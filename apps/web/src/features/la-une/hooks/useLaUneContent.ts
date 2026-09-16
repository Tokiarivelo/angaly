import { useMemo } from 'react';

import type { PublicPageSectionDto } from '../api/la-une.api';
import { useLaUneSectionsContentQuery } from '../api/la-une.api';

export interface LaUneContent {
  header: { eyebrow: string; title: string; subtitle: string };
}

/**
 * Default editorial copy for the ANGALY "La Une" page header — the fallback
 * when the CMS (`GET /content/public/la-une`, PUBLISHED-only, see
 * docs/features/content.md) has no `header` row yet. Mirrors the real Stitch
 * "La Une (Editorial Showcase)" screen — see docs/pages/la-une.md.
 */
const DEFAULT_LA_UNE_CONTENT: LaUneContent = {
  header: {
    eyebrow: 'Éditorial',
    title: 'LA UNE',
    subtitle: "Les créations qui incarnent l'univers Angaly — sélectionnées et renouvelées par la maison.",
  },
};

function sectionsByKey(sections: PublicPageSectionDto[] | undefined): Map<string, PublicPageSectionDto> {
  const map = new Map<string, PublicPageSectionDto>();
  for (const section of sections ?? []) {
    map.set(section.sectionKey, section);
  }
  return map;
}

function extractEyebrow(dataJson: unknown): string | undefined {
  if (dataJson && typeof dataJson === 'object' && 'eyebrow' in dataJson) {
    const value = (dataJson as { eyebrow?: unknown }).eyebrow;
    return typeof value === 'string' ? value : undefined;
  }
  return undefined;
}

/**
 * Merges the PUBLISHED `PageSection` row (`page="la-une"`, `sectionKey="header"`)
 * onto `DEFAULT_LA_UNE_CONTENT`. Absent from the CMS response (never edited
 * yet, or its only row still `DRAFT` — the public endpoint never returns
 * those) falls back entirely to the hardcoded default; an individual
 * null/missing field within a present section also falls back to its own
 * default field.
 */
function applyCmsSections(base: LaUneContent, sections: PublicPageSectionDto[] | undefined): LaUneContent {
  const header = sectionsByKey(sections).get('header');

  return {
    ...base,
    header: {
      ...base.header,
      eyebrow: extractEyebrow(header?.dataJson) ?? base.header.eyebrow,
      title: header?.titleText ?? base.header.title,
      subtitle: header?.subtitleText ?? base.header.subtitle,
    },
  };
}

export function useLaUneContent(): { data: LaUneContent; isLoading: boolean; error: Error | null } {
  const { data: sections, isLoading, error } = useLaUneSectionsContentQuery();

  const data = useMemo(() => applyCmsSections(DEFAULT_LA_UNE_CONTENT, sections), [sections]);

  return { data, isLoading, error };
}
