import { useQuery } from '@tanstack/react-query';
import type { AtelierDto, Locale } from '@angaly/types';

import { apiClient } from '@/lib/api-client';

import { QUERY_KEYS } from '../consts/queryKeys';

/** Real endpoint — see docs/features/ateliers.md. No pagination (low expected volume). */
export function useAteliersListQuery() {
  return useQuery({
    queryKey: QUERY_KEYS.ateliersList,
    queryFn: () => apiClient.get<AtelierDto[]>('/ateliers'),
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
 * unauthenticated, PUBLISHED-only sections for the `nos-ateliers-liste` page
 * — ninth page of the docs/phases/phase-6-admin-cms.md step 4 slice (after
 * `home`, `a-propos`, `la-une`, `nos-creations-galerie`, `creation-detail`,
 * `contact`, `collections-liste`, `collection-detail`).
 * `useAteliersListeContent` merges these onto the hardcoded header defaults
 * by `sectionKey`.
 */
export function useAteliersListeSectionsContentQuery() {
  return useQuery({
    queryKey: QUERY_KEYS.content,
    queryFn: () => apiClient.get<PublicPageSectionDto[]>('/content/public/nos-ateliers-liste'),
  });
}
