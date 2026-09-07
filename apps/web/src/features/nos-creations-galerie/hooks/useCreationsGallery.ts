import { useEffect, useState } from 'react';
import type { CreationDto } from '@angaly/types';

import { useCreationsPageQuery } from '../api/nos-creations-galerie.api';
import type { GallerySort } from '../types/gallery.types';

/**
 * Real offset pagination accumulated into a "load more" list — page resets
 * to 1 whenever `sort` changes (see docs/pages/nos-creations-galerie.md
 * "AVOID a heavy paginated list, prefer progressive loading").
 */
export function useCreationsGallery(sort: GallerySort): {
  items: CreationDto[];
  total: number;
  isLoading: boolean;
  isLoadingMore: boolean;
  hasNextPage: boolean;
  loadMore: () => void;
} {
  const [page, setPage] = useState(1);
  const [items, setItems] = useState<CreationDto[]>([]);
  const query = useCreationsPageQuery(page, sort);

  useEffect(() => {
    setPage(1);
    setItems([]);
  }, [sort]);

  useEffect(() => {
    if (!query.data) return;
    setItems((previous) => (page === 1 ? query.data.data : [...previous, ...query.data.data]));
  }, [query.data, page]);

  return {
    items,
    total: query.data?.meta.total ?? 0,
    isLoading: query.isLoading && page === 1,
    isLoadingMore: query.isFetching && page > 1,
    hasNextPage: query.data?.meta.hasNextPage ?? false,
    loadMore: () => setPage((current) => current + 1),
  };
}
