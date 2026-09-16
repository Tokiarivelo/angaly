import { useQuery } from '@tanstack/react-query';
import type { CollectionDto, Locale, PaginatedResponse } from '@angaly/types';

import { apiClient } from '@/lib/api-client';

/**
 * Local response shape mirroring `PublicPageSectionResponseDto`
 * (`apps/api/src/content`) — same duplication convention as
 * `home/api/home.api.ts#PublicPageSectionDto` /
 * `la-une/api/la-une.api.ts#PublicPageSectionDto`. No `status`/
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
 * unauthenticated, PUBLISHED-only sections for the `collections-liste` page
 * — seventh page of the docs/phases/phase-6-admin-cms.md step 4 slice
 * (after `home`, `a-propos`, `la-une`, `nos-creations-galerie`,
 * `creation-detail`, `contact`). `useCollectionsContent` merges these onto
 * the hardcoded header defaults by `sectionKey`.
 */
export function useCollectionsSectionsContentQuery() {
  return useQuery({
    queryKey: ['collections-liste', 'content'],
    queryFn: () => apiClient.get<PublicPageSectionDto[]>('/content/public/collections-liste'),
  });
}

const LIST_LIMIT = 40;

/** Real endpoint — see docs/features/collections.md. Only ever returns published collections. */
export function useCollectionsListQuery() {
  return useQuery({
    queryKey: ['collections-liste', 'list'],
    queryFn: () =>
      apiClient.get<PaginatedResponse<CollectionDto>>(`/collections?sort=seasonYear:desc&limit=${LIST_LIMIT}`),
  });
}

/**
 * `Collection` has no `isFeatured` field (unlike `Creation`) — "Collection du moment" is
 * derived as the most recently published one, same resolution as docs/pages/la-une.md's
 * own hero derivation.
 */
export function useFeaturedCollectionQuery() {
  return useQuery({
    queryKey: ['collections-liste', 'featured'],
    queryFn: () => apiClient.get<PaginatedResponse<CollectionDto>>('/collections?sort=publishedAt:desc&limit=1'),
  });
}
