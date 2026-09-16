import { useQuery } from '@tanstack/react-query';
import type { Locale } from '@angaly/types';

import { apiClient } from '@/lib/api-client';

/**
 * Local response shape mirroring `PublicPageSectionResponseDto`
 * (`apps/api/src/content`) — same duplication convention as
 * `home/api/home.api.ts#PublicPageSectionDto` /
 * `journal-article/api/journal-article.api.ts#PublicPageSectionDto`. No
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
  updatedAt: string;
}

/**
 * Real endpoint — see docs/features/content.md ("Endpoint public"). Public,
 * unauthenticated, PUBLISHED-only sections for the `page-404` page —
 * thirteenth page of the docs/phases/phase-6-admin-cms.md step 4 slice
 * (after `home`, `a-propos`, `la-une`, `nos-creations-galerie`,
 * `creation-detail`, `contact`, `collections-liste`, `collection-detail`,
 * `nos-ateliers-liste`, `atelier-detail`, `journal-liste`,
 * `journal-article`). `usePage404Content` merges these onto the hardcoded
 * title/subtitle defaults by `sectionKey`.
 */
export function usePage404SectionsContentQuery() {
  return useQuery({
    queryKey: ['page-404', 'content'],
    queryFn: () => apiClient.get<PublicPageSectionDto[]>('/content/public/page-404'),
  });
}
