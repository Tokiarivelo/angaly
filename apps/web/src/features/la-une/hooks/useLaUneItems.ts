import { useMemo } from 'react';

import { useFeaturedCollectionQuery, useFeaturedCreationsQuery } from '../api/la-une.api';
import type { LaUneItem } from '../types/la-une-item.types';
import { buildLaUneItems } from '../utils/buildLaUneItems';

export function useLaUneItems(): {
  hero: LaUneItem | null;
  grid: LaUneItem[];
  isLoading: boolean;
  error: Error | null;
} {
  const creationsQuery = useFeaturedCreationsQuery();
  const collectionQuery = useFeaturedCollectionQuery();

  const creations = useMemo(() => creationsQuery.data?.data ?? [], [creationsQuery.data]);
  const featuredCollection = collectionQuery.data?.data[0] ?? null;

  const items = useMemo(
    () => buildLaUneItems(creations, featuredCollection),
    [creations, featuredCollection],
  );

  return {
    hero: items[0] ?? null,
    grid: items.slice(1),
    isLoading: creationsQuery.isLoading || collectionQuery.isLoading,
    error: creationsQuery.error ?? collectionQuery.error,
  };
}
