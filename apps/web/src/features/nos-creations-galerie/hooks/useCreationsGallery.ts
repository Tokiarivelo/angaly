import { useEffect, useState } from 'react';
import type { CreationDto } from '@angaly/types';

import { useCreationsPageQuery } from '../api/nos-creations-galerie.api';
import type { GallerySort } from '../types/gallery.types';

export interface GalleryFilterParams {
  categoryId?: string | null;
  genre?: string | null;
  type?: string | null;
  color?: string | null;
  style?: string | null;
}

/**
 * Real offset pagination accumulated into a "load more" list — page resets
 * to 1 whenever `sort` or any filter changes (see docs/pages/nos-creations-
 * galerie.md "AVOID a heavy paginated list, prefer progressive loading").
 */
export function useCreationsGallery(
  sort: GallerySort,
  filtersOrCategoryId?: string | null | GalleryFilterParams,
): {
  items: CreationDto[];
  total: number;
  isLoading: boolean;
  isLoadingMore: boolean;
  hasNextPage: boolean;
  loadMore: () => void;
} {
  const filters: GalleryFilterParams =
    typeof filtersOrCategoryId === 'string' || filtersOrCategoryId === null
      ? { categoryId: filtersOrCategoryId }
      : (filtersOrCategoryId ?? {});

  const { categoryId = null, genre = null, type = null, color = null, style = null } = filters;

  const [page, setPage] = useState(1);
  const [accumulatedItems, setAccumulatedItems] = useState<CreationDto[]>([]);
  const query = useCreationsPageQuery(page, sort, { categoryId, genre, type, color, style });

  useEffect(() => {
    setPage(1);
    setAccumulatedItems([]);
  }, [sort, categoryId, genre, type, color, style]);

  useEffect(() => {
    if (!query.data) return;
    if (page === 1) {
      setAccumulatedItems(query.data.data);
    } else {
      setAccumulatedItems((previous) => [...previous, ...query.data.data]);
    }
  }, [query.data, page]);

  const items = page === 1 ? (query.data?.data ?? accumulatedItems) : accumulatedItems;

  return {
    items,
    total: query.data?.meta.total ?? 0,
    isLoading: query.isLoading && page === 1,
    isLoadingMore: query.isFetching && page > 1,
    hasNextPage: query.data?.meta.hasNextPage ?? false,
    loadMore: () => setPage((current) => current + 1),
  };
}
