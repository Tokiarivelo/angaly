import { useMemo } from 'react';

import type { PublicPageSectionDto } from '../api/collection-detail.api';
import { useCollectionDetailSectionsContentQuery } from '../api/collection-detail.api';

export interface CollectionDetailContent {
  closingCta: { headline: string; ctaPrimaryLabel: string; ctaSecondaryLabel: string };
}

/**
 * Default editorial copy for the ANGALY "Collection Éternelle (Detail Page)"
 * closing CTA band — the fallback when the CMS
 * (`GET /content/public/collection-detail`, PUBLISHED-only, see
 * docs/features/content.md) has no `closing-cta` row yet. Mirrors the real
 * Stitch screen's closing band — see docs/pages/collection-detail.md.
 */
const DEFAULT_COLLECTION_DETAIL_CONTENT: CollectionDetailContent = {
  closingCta: {
    headline: 'Vous souhaitez porter une pièce de cette collection ?',
    ctaPrimaryLabel: 'Prendre rendez-vous',
    ctaSecondaryLabel: 'Voir toutes les collections',
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
 * Merges the PUBLISHED `PageSection` row (`page="collection-detail"`,
 * `sectionKey="closing-cta"`) onto `DEFAULT_COLLECTION_DETAIL_CONTENT`.
 * Absent from the CMS response (never edited yet, or its only row still
 * `DRAFT` — the public endpoint never returns those) falls back entirely to
 * the hardcoded default; an individual null/missing field within a present
 * section also falls back to its own default field.
 */
function applyCmsSections(
  base: CollectionDetailContent,
  sections: PublicPageSectionDto[] | undefined,
): CollectionDetailContent {
  const closingCta = sectionsByKey(sections).get('closing-cta');

  return {
    ...base,
    closingCta: {
      ...base.closingCta,
      headline: closingCta?.titleText ?? base.closingCta.headline,
      ctaPrimaryLabel: closingCta?.ctaPrimaryLabel ?? base.closingCta.ctaPrimaryLabel,
      ctaSecondaryLabel: closingCta?.ctaSecondaryLabel ?? base.closingCta.ctaSecondaryLabel,
    },
  };
}

export function useCollectionDetailContent(): {
  data: CollectionDetailContent;
  isLoading: boolean;
  error: Error | null;
} {
  const { data: sections, isLoading, error } = useCollectionDetailSectionsContentQuery();

  const data = useMemo(() => applyCmsSections(DEFAULT_COLLECTION_DETAIL_CONTENT, sections), [sections]);

  return { data, isLoading, error };
}
