import { useMemo } from 'react';

import type { PublicPageSectionDto } from '../api/creation-detail.api';
import { useCreationDetailSectionsContentQuery } from '../api/creation-detail.api';

export interface CreationDetailContent {
  savoirFaire: { title: string; paragraph: string };
}

/**
 * Default editorial copy for `CraftsmanshipStory.tsx`'s "Le savoir-faire
 * derrière cette création" section — the fallback when the CMS
 * (`GET /content/public/creation-detail`, PUBLISHED-only, see
 * docs/features/content.md) has no `savoir-faire` row yet. Same generic
 * maison copy as before the migration — see docs/pages/creation-detail.md
 * for why it's generic rather than per-creation.
 */
const DEFAULT_CREATION_DETAIL_CONTENT: CreationDetailContent = {
  savoirFaire: {
    title: 'Le savoir-faire derrière cette création',
    paragraph:
      "Chaque pièce Angaly naît d'un dialogue entre la vision d'une couturière et le geste d'un artisan. Nos ateliers malgaches perpétuent des techniques transmises de génération en génération, du choix des matières les plus nobles jusqu'à la dernière retouche.",
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
 * Merges the PUBLISHED `PageSection` row (`page="creation-detail"`,
 * `sectionKey="savoir-faire"`) onto `DEFAULT_CREATION_DETAIL_CONTENT`.
 * Absent from the CMS response (never edited yet, or its only row still
 * `DRAFT` — the public endpoint never returns those) falls back entirely to
 * the hardcoded default; an individual null/missing field within a present
 * section also falls back to its own default field.
 */
function applyCmsSections(
  base: CreationDetailContent,
  sections: PublicPageSectionDto[] | undefined,
): CreationDetailContent {
  const savoirFaire = sectionsByKey(sections).get('savoir-faire');

  return {
    ...base,
    savoirFaire: {
      ...base.savoirFaire,
      title: savoirFaire?.titleText ?? base.savoirFaire.title,
      paragraph: savoirFaire?.bodyText ?? base.savoirFaire.paragraph,
    },
  };
}

export function useCreationDetailContent(): {
  data: CreationDetailContent;
  isLoading: boolean;
  error: Error | null;
} {
  const { data: sections, isLoading, error } = useCreationDetailSectionsContentQuery();

  const data = useMemo(() => applyCmsSections(DEFAULT_CREATION_DETAIL_CONTENT, sections), [sections]);

  return { data, isLoading, error };
}
