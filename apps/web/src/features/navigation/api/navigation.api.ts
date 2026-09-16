import { useQuery } from '@tanstack/react-query';
import type { Locale, SearchResultsResponseDto } from '@angaly/types';

import { apiClient } from '@/lib/api-client';

import { MIN_SEARCH_QUERY_LENGTH } from '../consts/search.const';
import { QUERY_KEYS } from '../consts/queryKeys';

const LIMIT_PER_TYPE = 5;

/** Real endpoint — see docs/features/search.md. Disabled below the backend's own minimum query length. */
export function useGlobalSearchQuery(query: string) {
  return useQuery({
    queryKey: QUERY_KEYS.globalSearch(query),
    queryFn: () =>
      apiClient.get<SearchResultsResponseDto>(
        `/search?q=${encodeURIComponent(query)}&limitPerType=${LIMIT_PER_TYPE}`,
      ),
    enabled: query.trim().length >= MIN_SEARCH_QUERY_LENGTH,
  });
}

/**
 * Local response shape mirroring `PublicPageSectionResponseDto`
 * (`apps/api/src/content`) — same duplication convention as
 * `home/api/home.api.ts#PublicPageSectionDto` /
 * `page-404/api/page-404.api.ts#PublicPageSectionDto`. No `status`/
 * `updatedById` — the public endpoint never returns them.
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
  updatedAt: string;
}

/**
 * Real endpoint — see docs/features/content.md ("Endpoint public"). Public,
 * unauthenticated, PUBLISHED-only sections for the `navigation-mobile` page
 * — fourteenth and last page of the docs/phases/phase-6-admin-cms.md step 4
 * slice (after `home`, `a-propos`, `la-une`, `nos-creations-galerie`,
 * `creation-detail`, `contact`, `collections-liste`, `collection-detail`,
 * `nos-ateliers-liste`, `atelier-detail`, `journal-liste`,
 * `journal-article`, `page-404`). `useNavigationContent` merges these onto
 * the hardcoded rendez-vous CTA label default by `sectionKey`.
 */
export function useNavigationSectionsContentQuery() {
  return useQuery({
    queryKey: QUERY_KEYS.content,
    queryFn: () => apiClient.get<PublicPageSectionDto[]>('/content/public/navigation-mobile'),
  });
}
