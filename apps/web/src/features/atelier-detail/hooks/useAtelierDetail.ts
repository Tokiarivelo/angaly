import type { AtelierDto } from '@angaly/types';

import { useAtelierDetailQuery } from '../api/atelier-detail.api';

export function useAtelierDetail(slug: string): {
  data: AtelierDto | undefined;
  isLoading: boolean;
  error: Error | null;
} {
  const query = useAtelierDetailQuery(slug);

  return {
    data: query.data,
    isLoading: query.isLoading,
    error: query.error,
  };
}
