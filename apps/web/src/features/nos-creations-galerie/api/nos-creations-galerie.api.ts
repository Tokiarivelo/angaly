import { useQuery } from '@tanstack/react-query';
import type { CreationDto, PaginatedResponse } from '@angaly/types';

import { apiClient } from '@/lib/api-client';

import { GALLERY_PAGE_SIZE } from '../consts/gallery-filters.const';
import type { GallerySort } from '../types/gallery.types';

/** Real endpoint — see docs/features/creations.md. Offset pagination via page/limit. */
export function useCreationsPageQuery(page: number, sort: GallerySort) {
  return useQuery({
    queryKey: ['nos-creations-galerie', 'creations', page, sort],
    queryFn: () =>
      apiClient.get<PaginatedResponse<CreationDto>>(
        `/creations?page=${page}&limit=${GALLERY_PAGE_SIZE}&sort=${sort}`,
      ),
  });
}
