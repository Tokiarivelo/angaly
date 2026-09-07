import type { CollectionDetailDto } from '@angaly/types';

import { useCollectionDetailQuery } from '../api/collection-detail.api';

export function useCollectionDetail(slug: string): {
  data: CollectionDetailDto | undefined;
  isLoading: boolean;
  error: Error | null;
} {
  const query = useCollectionDetailQuery(slug);

  return {
    data: query.data,
    isLoading: query.isLoading,
    error: query.error,
  };
}
