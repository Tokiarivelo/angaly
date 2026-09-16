import { useQuery } from '@tanstack/react-query';
import type { CreationDto, Locale, MediaDto, PaginatedResponse } from '@angaly/types';

import { apiClient } from '@/lib/api-client';

import { QUERY_KEYS } from '../consts/queryKeys';
import type { AtelierSummary, BlogPostSummary, Testimonial } from '../types';

/**
 * Local response shape mirroring `PublicPageSectionResponseDto`
 * (`apps/api/src/content`) — same duplication convention as
 * `admin-gestion-contenu/api/page-sections.api.ts` (a dedicated shared
 * `@angaly/types` entry can be added once a third consumer needs it). No
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

/** Real endpoint — see docs/features/creations.md. */
export function useFeaturedCreationsQuery(limit = 6) {
  return useQuery({
    queryKey: [...QUERY_KEYS.featuredCreations, limit],
    queryFn: () =>
      apiClient.get<PaginatedResponse<CreationDto>>(`/creations?isFeatured=true&limit=${limit}`),
  });
}

/**
 * Real endpoint — see docs/features/ateliers.md. Not in docs/pages/home.md's original
 * endpoint table (written before the `ateliers` module existed) — wiring it live is a
 * deliberate improvement over a static teaser, documented in the page doc.
 */
export function useAteliersTeaserQuery() {
  return useQuery({
    queryKey: QUERY_KEYS.ateliersTeaser,
    queryFn: () => apiClient.get<AtelierSummary[]>('/ateliers'),
  });
}

/** Real endpoint — see docs/features/blog.md. Same note as useAteliersTeaserQuery. */
export function useJournalTeaserQuery(limit = 4) {
  return useQuery({
    queryKey: [...QUERY_KEYS.journalTeaser, limit],
    queryFn: () =>
      apiClient.get<PaginatedResponse<BlogPostSummary>>(`/blog-posts?limit=${limit}`),
  });
}

/** Mocked via MSW — `reviews` module doesn't exist yet (Phase 2), see docs/pages/home.md. */
export function useTestimonialsQuery() {
  return useQuery({
    queryKey: QUERY_KEYS.testimonials,
    queryFn: () => apiClient.get<Testimonial[]>('/testimonials?featured=true'),
  });
}

/** Real endpoint — see docs/features/media.md. Loads PAGE_SECTION media for the home page. */
export function useHomeSectionsMediaQuery() {
  return useQuery({
    queryKey: QUERY_KEYS.homeMedia,
    queryFn: () =>
      apiClient.get<PaginatedResponse<MediaDto>>('/media?entityType=PAGE_SECTION&limit=20'),
  });
}

/**
 * Real endpoint — see docs/features/content.md ("Endpoint public"). Public,
 * unauthenticated, PUBLISHED-only sections for the `accueil` page — first
 * slice of docs/phases/phase-6-admin-cms.md step 4. `useHomeContent` merges
 * these onto `DEFAULT_HOME_CONTENT` by `sectionKey`.
 */
export function useHomeSectionsContentQuery() {
  return useQuery({
    queryKey: QUERY_KEYS.content,
    queryFn: () => apiClient.get<PublicPageSectionDto[]>('/content/public/accueil'),
  });
}

