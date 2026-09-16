import { useQuery } from '@tanstack/react-query';
import type { CreationDto, Locale, PaginatedResponse } from '@angaly/types';

import { apiClient } from '@/lib/api-client';

const RELATED_LIMIT = 4;

/** Real endpoint — see docs/features/creations.md. Same CreationDto shape as the list. */
export function useCreationDetailQuery(slug: string) {
  return useQuery({
    queryKey: ['creation-detail', slug],
    queryFn: () => apiClient.get<CreationDto>(`/creations/${slug}`),
  });
}

/** Same collection, current creation excluded client-side (no `excludeId` query param). */
export function useCollectionCreationsQuery(collectionId: string | null) {
  return useQuery({
    queryKey: ['creation-detail', 'collection-creations', collectionId],
    queryFn: () =>
      apiClient.get<PaginatedResponse<CreationDto>>(`/creations?collectionId=${collectionId}&limit=${RELATED_LIMIT + 1}`),
    enabled: collectionId !== null,
  });
}

/** Same category, current creation excluded client-side. */
export function useCategoryCreationsQuery(categoryId: string | null) {
  return useQuery({
    queryKey: ['creation-detail', 'category-creations', categoryId],
    queryFn: () =>
      apiClient.get<PaginatedResponse<CreationDto>>(`/creations?categoryId=${categoryId}&limit=${RELATED_LIMIT + 1}`),
    enabled: categoryId !== null,
  });
}

/**
 * Local response shape mirroring `PublicPageSectionResponseDto`
 * (`apps/api/src/content`) — same duplication convention as
 * `home/api/home.api.ts#PublicPageSectionDto` / `a-propos/api/a-propos.api.ts` /
 * `la-une/api/la-une.api.ts` / `nos-creations-galerie/api/nos-creations-galerie.api.ts`.
 * No `status`/`updatedById` — the public endpoint never returns them.
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
 * unauthenticated, PUBLISHED-only sections for the `creation-detail` page —
 * fifth page of the docs/phases/phase-6-admin-cms.md step 4 slice (after
 * `home`, `a-propos`, `la-une`, `nos-creations-galerie`).
 * `useCreationDetailContent` merges these onto the hardcoded
 * "savoir-faire" defaults by `sectionKey`.
 */
export function useCreationDetailSectionsContentQuery() {
  return useQuery({
    queryKey: ['creation-detail', 'content'],
    queryFn: () => apiClient.get<PublicPageSectionDto[]>('/content/public/creation-detail'),
  });
}
