import { useMemo } from 'react';

import type { PublicPageSectionDto } from '../api/contact.api';
import { useContactSectionsContentQuery } from '../api/contact.api';

export interface ContactContent {
  header: { title: string; subtitle: string };
}

/**
 * Default editorial copy for the ANGALY "Contactez-nous" page header — the
 * fallback when the CMS (`GET /content/public/contact`, PUBLISHED-only, see
 * docs/features/content.md) has no `header` row yet. Mirrors the real Stitch
 * "Contactez-nous" screen — see docs/pages/contact.md. Channels (phone/
 * WhatsApp/email/socials/hours) stay hardcoded in `useContactChannels.ts` —
 * out of scope for this pass, see docs/pages/contact.md "Points d'attention".
 */
const DEFAULT_CONTACT_CONTENT: ContactContent = {
  header: {
    title: 'Contactez-nous',
    subtitle: 'Une question, un projet ? Nous sommes à votre écoute.',
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
 * Merges the PUBLISHED `PageSection` row (`page="contact"`,
 * `sectionKey="header"`) onto `DEFAULT_CONTACT_CONTENT`. Absent from the CMS
 * response (never edited yet, or its only row still `DRAFT` — the public
 * endpoint never returns those) falls back entirely to the hardcoded
 * default; an individual null/missing field within a present section also
 * falls back to its own default field.
 */
function applyCmsSections(base: ContactContent, sections: PublicPageSectionDto[] | undefined): ContactContent {
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

export function useContactContent(): { data: ContactContent; isLoading: boolean; error: Error | null } {
  const { data: sections, isLoading, error } = useContactSectionsContentQuery();

  const data = useMemo(() => applyCmsSections(DEFAULT_CONTACT_CONTENT, sections), [sections]);

  return { data, isLoading, error };
}
