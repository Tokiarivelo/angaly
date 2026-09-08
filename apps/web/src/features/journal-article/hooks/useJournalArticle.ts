import type { BlogPostDetailDto } from '@angaly/types';

import { useJournalArticleQuery } from '../api/journal-article.api';

export function useJournalArticle(slug: string): {
  data: BlogPostDetailDto | undefined;
  isLoading: boolean;
  error: Error | null;
} {
  const query = useJournalArticleQuery(slug);

  return {
    data: query.data,
    isLoading: query.isLoading,
    error: query.error,
  };
}
