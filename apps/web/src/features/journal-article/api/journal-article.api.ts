import { useQuery } from '@tanstack/react-query';
import type { BlogPostDetailDto, BlogPostDto } from '@angaly/types';

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
