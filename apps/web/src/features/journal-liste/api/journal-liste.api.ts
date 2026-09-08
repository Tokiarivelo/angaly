import { useQuery } from '@tanstack/react-query';
import type { BlogPostDto, PaginatedResponse } from '@angaly/types';

import { apiClient } from '@/lib/api-client';

import { QUERY_KEYS } from '../consts/queryKeys';

const FETCH_LIMIT = 50;

/**
 * Real endpoint — see docs/features/blog.md. Always sorted `publishedAt desc` server-side
 * (no `sort` param on this endpoint). Fetched once, unfiltered — see
 * docs/pages/journal-liste.md "Points d'attention" for why category filtering/pagination
 * below this point are client-side.
 */
export function useJournalArticlesQuery() {
  return useQuery({
    queryKey: QUERY_KEYS.articles,
    queryFn: () => apiClient.get<PaginatedResponse<BlogPostDto>>(`/blog-posts?limit=${FETCH_LIMIT}`),
  });
}
