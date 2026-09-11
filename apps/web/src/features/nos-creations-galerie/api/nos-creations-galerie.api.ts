import { useQuery } from '@tanstack/react-query';
import type { CategoryDto, CreationDto, PaginatedResponse } from '@angaly/types';

import { apiClient } from '@/lib/api-client';

import { GALLERY_PAGE_SIZE } from '../consts/gallery-filters.const';
import type { GallerySort } from '../types/gallery.types';

export interface CreationsQueryFilters {
  categoryId?: string | null;
  genre?: string | null;
  type?: string | null;
  color?: string | null;
  style?: string | null;
}

/** Real endpoint — see docs/features/creations.md. Offset pagination via page/limit. */
export function useCreationsPageQuery(
  page: number,
  sort: GallerySort,
  filters?: CreationsQueryFilters,
) {
  const categoryId = filters?.categoryId ?? null;
  const genre = filters?.genre ?? null;
  const type = filters?.type ?? null;
  const color = filters?.color ?? null;
  const style = filters?.style ?? null;

  return useQuery({
    queryKey: ['nos-creations-galerie', 'creations', page, sort, categoryId, genre, type, color, style],
    queryFn: () => {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(GALLERY_PAGE_SIZE),
        sort,
      });
      if (categoryId) params.set('categoryId', categoryId);
      if (genre) params.set('genre', genre);
      if (type) params.set('type', type);
      if (color) params.set('color', color);
      if (style) params.set('style', style);

      return apiClient.get<PaginatedResponse<CreationDto>>(`/creations?${params.toString()}`);
    },
  });
}

/** Real endpoint — see docs/features/categories.md. Powers the "Catégorie" filter — the only real dropdown, see gallery-filters.const.ts. */
export function useCategoriesQuery() {
  return useQuery({
    queryKey: ['nos-creations-galerie', 'categories'],
    queryFn: () => apiClient.get<CategoryDto[]>('/categories?kind=CREATION'),
  });
}
