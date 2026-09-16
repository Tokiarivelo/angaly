import { useMemo } from 'react';

import type { PublicPageSectionDto } from '../api/navigation.api';
import { useNavigationSectionsContentQuery } from '../api/navigation.api';

export interface NavigationContent {
  cta: { label: string };
}

/**
 * Default editorial copy for the ANGALY mobile navigation's rendez-vous
 * CTA — shared by `MobileDrawer`'s footer button and `MobileBottomBar`'s
 * raised button — the fallback when the CMS
 * (`GET /content/public/navigation-mobile`, PUBLISHED-only, see
 * docs/features/content.md) has no `cta` row yet. Mirrors the real Stitch
 * "Menu Mobile"/"Navigation Mobile & FAB" screens — see
 * docs/pages/navigation-mobile.md.
 */
const DEFAULT_NAVIGATION_CONTENT: NavigationContent = {
  cta: { label: 'Prendre rendez-vous' },
};

function sectionsByKey(sections: PublicPageSectionDto[] | undefined): Map<string, PublicPageSectionDto> {
  const map = new Map<string, PublicPageSectionDto>();
  for (const section of sections ?? []) {
    map.set(section.sectionKey, section);
  }
  return map;
}

/**
 * Merges the PUBLISHED `PageSection` row (`page="navigation-mobile"`,
 * `sectionKey="cta"`) onto `DEFAULT_NAVIGATION_CONTENT`. Absent from the
 * CMS response (never edited yet, or its only row still `DRAFT` — the
 * public endpoint never returns those) falls back entirely to the
 * hardcoded default; an individual null/missing field within a present
 * section also falls back to its own default field.
 */
function applyCmsSections(base: NavigationContent, sections: PublicPageSectionDto[] | undefined): NavigationContent {
  const cta = sectionsByKey(sections).get('cta');

  return {
    ...base,
    cta: {
      ...base.cta,
      label: cta?.ctaPrimaryLabel ?? base.cta.label,
    },
  };
}

export function useNavigationContent(): {
  data: NavigationContent;
  isLoading: boolean;
  error: Error | null;
} {
  const { data: sections, isLoading, error } = useNavigationSectionsContentQuery();

  const data = useMemo(() => applyCmsSections(DEFAULT_NAVIGATION_CONTENT, sections), [sections]);

  return { data, isLoading, error };
}
