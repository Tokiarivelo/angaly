import { useQuery } from '@tanstack/react-query';
import type { CreationDto, MediaDto, PaginatedResponse } from '@angaly/types';

import { apiClient } from '@/lib/api-client';

import { QUERY_KEYS } from '../consts/queryKeys';
import type { AtelierSummary, BlogPostSummary, Testimonial } from '../types';

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

