import { useQuery } from '@tanstack/react-query';
import type { AtelierDto, Locale } from '@angaly/types';

import { apiClient } from '@/lib/api-client';

/** Real endpoint — see docs/features/ateliers.md. */
export function useAtelierDetailQuery(slug: string) {
  return useQuery({
    queryKey: ['atelier-detail', slug],
    queryFn: () => apiClient.get<AtelierDto>(`/ateliers/${slug}`),
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
 * unauthenticated, PUBLISHED-only sections for the `atelier-detail` page —
 * tenth page of the docs/phases/phase-6-admin-cms.md step 4 slice (after
 * `home`, `a-propos`, `la-une`, `nos-creations-galerie`, `creation-detail`,
 * `contact`, `collections-liste`, `collection-detail`, `nos-ateliers-liste`).
 * `useAtelierDetailContent` merges these onto the hardcoded hero defaults
 * by `sectionKey`.
 */
export function useAtelierDetailSectionsContentQuery() {
  return useQuery({
    queryKey: ['atelier-detail', 'content'],
    queryFn: () => apiClient.get<PublicPageSectionDto[]>('/content/public/atelier-detail'),
  });
}
