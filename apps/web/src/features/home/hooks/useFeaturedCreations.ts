import type { CreationDto } from '@angaly/types';

import { useFeaturedCreationsQuery } from '../api/home.api';

export function useFeaturedCreations(limit = 6): {
  data: CreationDto[];
  isLoading: boolean;
  error: Error | null;
} {
  const query = useFeaturedCreationsQuery(limit);

  return {
    data: query.data?.data ?? [],
    isLoading: query.isLoading,
    error: query.error,
  };
}
