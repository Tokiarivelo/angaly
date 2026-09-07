import type { CollectionDto } from '@angaly/types';

import { useFeaturedCollectionQuery } from '../api/collections-liste.api';

export function useFeaturedCollection(): {
  data: CollectionDto | null;
  isLoading: boolean;
} {
  const query = useFeaturedCollectionQuery();

  return {
    data: query.data?.data[0] ?? null,
    isLoading: query.isLoading,
  };
}
