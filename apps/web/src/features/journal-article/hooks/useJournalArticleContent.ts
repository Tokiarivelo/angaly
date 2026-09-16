import { useMemo } from 'react';

import type { PublicPageSectionDto } from '../api/journal-article.api';
import { useJournalArticleSectionsContentQuery } from '../api/journal-article.api';

export interface JournalArticleContent {
  closingCta: { headline: string; body: string; ctaPrimaryLabel: string };
}

/**
 * Default editorial copy for the ANGALY "Article" screen's closing
 * appointment CTA band — the fallback when the CMS
 * (`GET /content/public/journal-article`, PUBLISHED-only, see
 * docs/features/content.md) has no `closing-cta` row yet. Mirrors the real
 * Stitch screen's closing band — see docs/pages/journal-article.md.
 */
const DEFAULT_JOURNAL_ARTICLE_CONTENT: JournalArticleContent = {
  closingCta: {
    headline: 'Envie de concrétiser votre projet ?',
    body: "Nos maîtres tailleurs vous reçoivent pour une consultation privée dans notre atelier d'Antananarivo.",
    ctaPrimaryLabel: 'Prendre rendez-vous',
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
 * Merges the PUBLISHED `PageSection` row (`page="journal-article"`,
 * `sectionKey="closing-cta"`) onto `DEFAULT_JOURNAL_ARTICLE_CONTENT`.
 * Absent from the CMS response (never edited yet, or its only row still
 * `DRAFT` — the public endpoint never returns those) falls back entirely to
 * the hardcoded default; an individual null/missing field within a present
 * section also falls back to its own default field.
 */
function applyCmsSections(
  base: JournalArticleContent,
  sections: PublicPageSectionDto[] | undefined,
): JournalArticleContent {
  const closingCta = sectionsByKey(sections).get('closing-cta');

  return {
    ...base,
    closingCta: {
      ...base.closingCta,
      headline: closingCta?.titleText ?? base.closingCta.headline,
      body: closingCta?.bodyText ?? base.closingCta.body,
      ctaPrimaryLabel: closingCta?.ctaPrimaryLabel ?? base.closingCta.ctaPrimaryLabel,
    },
  };
}

export function useJournalArticleContent(): {
  data: JournalArticleContent;
  isLoading: boolean;
  error: Error | null;
} {
  const { data: sections, isLoading, error } = useJournalArticleSectionsContentQuery();

  const data = useMemo(() => applyCmsSections(DEFAULT_JOURNAL_ARTICLE_CONTENT, sections), [sections]);

  return { data, isLoading, error };
}
