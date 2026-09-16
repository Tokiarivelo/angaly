import { useQuery } from '@tanstack/react-query';
import type { CollectionDetailDto, Locale } from '@angaly/types';

import { apiClient } from '@/lib/api-client';

/** Real endpoint — see docs/features/collections.md. Already includes `creations[]`, no separate call needed. */
export function useCollectionDetailQuery(slug: string) {
  return useQuery({
    queryKey: ['collection-detail', slug],
    queryFn: () => apiClient.get<CollectionDetailDto>(`/collections/${slug}`),
  });
}

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
 * unauthenticated, PUBLISHED-only sections for the `collection-detail` page
 * — eighth page of the docs/phases/phase-6-admin-cms.md step 4 slice
 * (after `home`, `a-propos`, `la-une`, `nos-creations-galerie`,
 * `creation-detail`, `contact`, `collections-liste`).
 * `useCollectionDetailContent` merges these onto the hardcoded closing CTA
 * band defaults by `sectionKey`.
 */
export function useCollectionDetailSectionsContentQuery() {
  return useQuery({
    queryKey: ['collection-detail', 'content'],
    queryFn: () => apiClient.get<PublicPageSectionDto[]>('/content/public/collection-detail'),
  });
}
