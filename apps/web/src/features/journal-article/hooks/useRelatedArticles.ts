import type { BlogPostDto } from '@angaly/types';

import { useRelatedArticlesQuery } from '../api/journal-article.api';

export function useRelatedArticles(slug: string): { articles: BlogPostDto[]; isLoading: boolean } {
  const { data, isLoading } = useRelatedArticlesQuery(slug);
  return { articles: data ?? [], isLoading };
}
