import { useAteliersTeaserQuery } from '../api/home.api';
import type { AtelierSummary } from '../types';

const TEASER_LIMIT = 3;

export function useAteliersTeaser(): {
  data: AtelierSummary[];
  isLoading: boolean;
  error: Error | null;
} {
  const query = useAteliersTeaserQuery();

  return {
    data: (query.data ?? []).slice(0, TEASER_LIMIT),
    isLoading: query.isLoading,
    error: query.error,
  };
}
