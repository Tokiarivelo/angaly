import { useMemo } from 'react';

import type { PublicPageSectionDto } from '../api/journal-liste.api';
import { useJournalListeSectionsContentQuery } from '../api/journal-liste.api';

export interface JournalListeContent {
  header: { title: string; subtitle: string };
}

/**
 * Default editorial copy for the ANGALY "Le Journal" header — the
 * fallback when the CMS (`GET /content/public/journal-liste`,
 * PUBLISHED-only, see docs/features/content.md) has no `header` row yet.
 * Mirrors the real Stitch "Le Journal (Editorial Listing)" screen — see
 * docs/pages/journal-liste.md.
 */
const DEFAULT_JOURNAL_LISTE_CONTENT: JournalListeContent = {
  header: {
    title: 'Le Journal Angaly',
    subtitle: "Mariage, mode, coulisses d'atelier et conseils d'entretien.",
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
 * Merges the PUBLISHED `PageSection` row (`page="journal-liste"`,
 * `sectionKey="header"`) onto `DEFAULT_JOURNAL_LISTE_CONTENT`. Absent from
 * the CMS response (never edited yet, or its only row still `DRAFT` — the
 * public endpoint never returns those) falls back entirely to the
 * hardcoded default; an individual null/missing field within a present
 * section also falls back to its own default field.
 */
function applyCmsSections(
  base: JournalListeContent,
  sections: PublicPageSectionDto[] | undefined,
): JournalListeContent {
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

export function useJournalListeContent(): {
  data: JournalListeContent;
  isLoading: boolean;
  error: Error | null;
} {
  const { data: sections, isLoading, error } = useJournalListeSectionsContentQuery();

  const data = useMemo(() => applyCmsSections(DEFAULT_JOURNAL_LISTE_CONTENT, sections), [sections]);

  return { data, isLoading, error };
}
