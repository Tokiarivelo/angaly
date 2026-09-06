import { useJournalTeaserQuery } from '../api/home.api';
import type { BlogPostSummary } from '../types';

export function useJournalTeaser(limit = 4): {
  data: BlogPostSummary[];
  isLoading: boolean;
  error: Error | null;
} {
  const query = useJournalTeaserQuery(limit);

  return {
    data: query.data?.data ?? [],
    isLoading: query.isLoading,
    error: query.error,
  };
}
