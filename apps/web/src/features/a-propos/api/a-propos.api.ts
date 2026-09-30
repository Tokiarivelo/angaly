import { useQuery } from '@tanstack/react-query';
import type { Locale } from '@angaly/types';

import { apiClient } from '@/lib/api-client';
import { publicContentPath } from '@/lib/public-content';
import { useLocaleStore } from '@/stores/locale.store';

import { QUERY_KEYS } from '../consts/queryKeys';

/**
 * Local response shape mirroring `PublicPageSectionResponseDto`
 * (`apps/api/src/content`) — same duplication convention as
 * `home/api/home.api.ts#PublicPageSectionDto` /
 * `admin-gestion-contenu/api/page-sections.api.ts` (a dedicated shared
 * `@angaly/types` entry can be added once a fourth consumer needs it). No
 * `status`/`updatedById` — the public endpoint never returns them.
 */
export interface PublicPageSectionDto {
  page: string;
  sectionKey: string;
  locale: Locale;
  titleText: string | null;
  subtitleText: string | null;
  bodyText: string | null;
  ctaPrimaryLabel: string | null;
  ctaSecondaryLabel: string | null;
  dataJson: unknown;
  mediaId: string | null;
  /** Image resolved server-side from `mediaId` — takes precedence over any default/heuristic image. */
  media?: { id: string; url: string; altText: string | null } | null;
  updatedAt: string;
}

/**
 * Real endpoint — see docs/features/content.md ("Endpoint public"). Public,
 * unauthenticated, PUBLISHED-only sections for the `a-propos` page — second
 * page of the docs/phases/phase-6-admin-cms.md step 4 slice (after `home`).
 * `useAProposContent` merges these onto the hardcoded defaults by
 * `sectionKey`.
 */
export function useAProposSectionsContentQuery() {
  const locale = useLocaleStore((state) => state.locale);
  return useQuery({
    queryKey: [...QUERY_KEYS.content, locale],
    queryFn: () => apiClient.get<PublicPageSectionDto[]>(publicContentPath('a-propos', locale)),
  });
}
