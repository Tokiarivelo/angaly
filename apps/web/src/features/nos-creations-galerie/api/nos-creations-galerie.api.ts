import { useQuery } from '@tanstack/react-query';
import type { CategoryDto, CreationDto, PaginatedResponse } from '@angaly/types';

import { apiClient } from '@/lib/api-client';

import { GALLERY_PAGE_SIZE } from '../consts/gallery-filters.const';
import type { GallerySort } from '../types/gallery.types';

/** Real endpoint — see docs/features/creations.md. Offset pagination via page/limit. */
export function useCreationsPageQuery(page: number, sort: GallerySort, categoryId: string | null) {
  return useQuery({
    queryKey: ['nos-creations-galerie', 'creations', page, sort, categoryId],
    queryFn: () =>
      apiClient.get<PaginatedResponse<CreationDto>>(
        `/creations?page=${page}&limit=${GALLERY_PAGE_SIZE}&sort=${sort}${categoryId ? `&categoryId=${categoryId}` : ''}`,
      ),
  });
}

/** Real endpoint — see docs/features/categories.md. Powers the "Catégorie" filter — the only real dropdown, see gallery-filters.const.ts. */
export function useCategoriesQuery() {
  return useQuery({
    queryKey: ['nos-creations-galerie', 'categories'],
    queryFn: () => apiClient.get<CategoryDto[]>('/categories?kind=CREATION'),
  });
}
