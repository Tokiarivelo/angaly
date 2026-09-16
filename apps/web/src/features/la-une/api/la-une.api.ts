import { useQuery } from '@tanstack/react-query';
import type { CollectionDto, CreationDto, Locale, PaginatedResponse } from '@angaly/types';

import { apiClient } from '@/lib/api-client';

/**
 * Local response shape mirroring `PublicPageSectionResponseDto`
 * (`apps/api/src/content`) — same duplication convention as
 * `home/api/home.api.ts#PublicPageSectionDto` /
 * `a-propos/api/a-propos.api.ts#PublicPageSectionDto`. No `status`/
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
 * unauthenticated, PUBLISHED-only sections for the `la-une` page — third
 * page of the docs/phases/phase-6-admin-cms.md step 4 slice (after `home`,
 * `a-propos`). `useLaUneContent` merges these onto the hardcoded header
 * defaults by `sectionKey`.
 */
export function useLaUneSectionsContentQuery() {
  return useQuery({
    queryKey: ['la-une', 'content'],
    queryFn: () => apiClient.get<PublicPageSectionDto[]>('/content/public/la-une'),
  });
}

const FEATURED_CREATIONS_LIMIT = 20;

/** Real endpoint — see docs/features/creations.md. Sorted by feature date, not just the isFeatured flag. */
export function useFeaturedCreationsQuery() {
  return useQuery({
    queryKey: ['la-une', 'featured-creations'],
    queryFn: () =>
      apiClient.get<PaginatedResponse<CreationDto>>(
        `/creations?isFeatured=true&sort=featuredFrom&limit=${FEATURED_CREATIONS_LIMIT}`,
      ),
  });
}

/**
 * Real endpoint — see docs/features/collections.md. `Collection` has no `isFeatured` field
 * (unlike `Creation`) — "collection du moment" is derived as the most recently published
 * one, same resolution as docs/pages/collections-liste.md's own banner.
 */
export function useFeaturedCollectionQuery() {
  return useQuery({
    queryKey: ['la-une', 'featured-collection'],
    queryFn: () =>
      apiClient.get<PaginatedResponse<CollectionDto>>('/collections?sort=publishedAt:desc&limit=1'),
  });
}
