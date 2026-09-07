import type { CollectionDto } from '@angaly/types';

import { useCollectionsListQuery } from '../api/collections-liste.api';
import { useFeaturedCollection } from './useFeaturedCollection';

/**
 * Real Stitch screen: the featured banner's collection never repeats in the
 * grid below it — excluded client-side (no `excludeId` server param).
 */
export function useCollectionsList(): {
  featured: CollectionDto | null;
  grid: CollectionDto[];
  isLoading: boolean;
} {
  const listQuery = useCollectionsListQuery();
  const { data: featured, isLoading: isFeaturedLoading } = useFeaturedCollection();

  const grid = (listQuery.data?.data ?? []).filter((collection) => collection.id !== featured?.id);

  return {
    featured,
    grid,
    isLoading: listQuery.isLoading || isFeaturedLoading,
  };
}
