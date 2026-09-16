import { useMemo } from 'react';

import type { PublicPageSectionDto } from '../api/atelier-detail.api';
import { useAtelierDetailSectionsContentQuery } from '../api/atelier-detail.api';

export interface AtelierDetailContent {
  hero: { tagline: string; precisionTileLabel: string };
}

/**
 * Default editorial copy for the ANGALY "Atelier ... (Detail)" hero — the
 * fallback when the CMS (`GET /content/public/atelier-detail`,
 * PUBLISHED-only, see docs/features/content.md) has no `hero` row yet.
 * Mirrors the real Stitch "Atelier Antananarivo Centre (Detail)" screen —
 * see docs/pages/atelier-detail.md. The `<h1>` itself stays `atelier.name`
 * (real data from `GET /api/ateliers/:slug`) — only the fixed tagline under
 * it and the decorative "L'art de la précision" tile label are editorial
 * literals. The ambiance gallery's heading/subtitle/quote and the local SEO
 * paragraph are out of scope for this slice — see "Points d'attention".
 */
const DEFAULT_ATELIER_DETAIL_CONTENT: AtelierDetailContent = {
  hero: {
    tagline: 'Le cœur de la création sur mesure',
    precisionTileLabel: "L'art de la précision",
  },
};

function sectionsByKey(sections: PublicPageSectionDto[] | undefined): Map<string, PublicPageSectionDto> {
  const map = new Map<string, PublicPageSectionDto>();
  for (const section of sections ?? []) {
    map.set(section.sectionKey, section);
  }
  return map;
}

function extractPrecisionTileLabel(dataJson: unknown): string | undefined {
  if (dataJson && typeof dataJson === 'object' && 'precisionTileLabel' in dataJson) {
    const value = (dataJson as { precisionTileLabel?: unknown }).precisionTileLabel;
    return typeof value === 'string' ? value : undefined;
  }
  return undefined;
}

/**
 * Merges the PUBLISHED `PageSection` row (`page="atelier-detail"`,
 * `sectionKey="hero"`) onto `DEFAULT_ATELIER_DETAIL_CONTENT`. Absent from
 * the CMS response (never edited yet, or its only row still `DRAFT` — the
 * public endpoint never returns those) falls back entirely to the
 * hardcoded default; an individual null/missing field within a present
 * section also falls back to its own default field.
 */
function applyCmsSections(
  base: AtelierDetailContent,
  sections: PublicPageSectionDto[] | undefined,
): AtelierDetailContent {
  const hero = sectionsByKey(sections).get('hero');

  return {
    ...base,
    hero: {
      ...base.hero,
      tagline: hero?.subtitleText ?? base.hero.tagline,
      precisionTileLabel: extractPrecisionTileLabel(hero?.dataJson) ?? base.hero.precisionTileLabel,
    },
  };
}

export function useAtelierDetailContent(): {
  data: AtelierDetailContent;
  isLoading: boolean;
  error: Error | null;
} {
  const { data: sections, isLoading, error } = useAtelierDetailSectionsContentQuery();

  const data = useMemo(() => applyCmsSections(DEFAULT_ATELIER_DETAIL_CONTENT, sections), [sections]);

  return { data, isLoading, error };
}
