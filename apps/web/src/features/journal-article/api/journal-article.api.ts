import { useQuery } from '@tanstack/react-query';
import type { BlogPostDetailDto, BlogPostDto, Locale } from '@angaly/types';

import { apiClient } from '@/lib/api-client';

const RELATED_LIMIT = 3;

/** Real endpoint — see docs/features/blog.md. */
export function useJournalArticleQuery(slug: string) {
  return useQuery({
    queryKey: ['journal-article', slug],
    queryFn: () => apiClient.get<BlogPostDetailDto>(`/blog-posts/${slug}`),
  });
}

/** Real endpoint — plain array (not paginated), same category, current article excluded server-side. */
export function useRelatedArticlesQuery(slug: string) {
  return useQuery({
    queryKey: ['journal-article', slug, 'related'],
    queryFn: () => apiClient.get<BlogPostDto[]>(`/blog-posts/${slug}/related?limit=${RELATED_LIMIT}`),
  });
}

/**
 * Local response shape mirroring `PublicPageSectionResponseDto`
 * (`apps/api/src/content`) — same duplication convention as
 * `home/api/home.api.ts#PublicPageSectionDto` /
 * `journal-liste/api/journal-liste.api.ts#PublicPageSectionDto`. No
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
 * unauthenticated, PUBLISHED-only sections for the `journal-article` page —
 * twelfth page of the docs/phases/phase-6-admin-cms.md step 4 slice (after
 * `home`, `a-propos`, `la-une`, `nos-creations-galerie`, `creation-detail`,
 * `contact`, `collections-liste`, `collection-detail`, `nos-ateliers-liste`,
 * `atelier-detail`, `journal-liste`). `useJournalArticleContent` merges
 * these onto the hardcoded closing CTA band defaults by `sectionKey`.
 */
export function useJournalArticleSectionsContentQuery() {
  return useQuery({
    queryKey: ['journal-article', 'content'],
    queryFn: () => apiClient.get<PublicPageSectionDto[]>('/content/public/journal-article'),
  });
}
