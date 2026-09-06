import { useMutation, useQuery } from '@tanstack/react-query';
import type { CreationDto, PaginatedResponse } from '@angaly/types';

import { apiClient } from '@/lib/api-client';

import { QUERY_KEYS } from '../consts/queryKeys';
import type { AtelierSummary, BlogPostSummary, Testimonial } from '../types';
import type { NewsletterFormValues } from '../schemas/newsletter.schema';

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

/** Mocked via MSW — `notifications`/`customers` don't exist yet (Phase 2), see docs/pages/home.md. */
export function useNewsletterSubscribeMutation() {
  return useMutation({
    mutationFn: (values: NewsletterFormValues) =>
      apiClient.post<{ subscribed: boolean }>('/newsletter/subscribe', { email: values.email }),
  });
}
