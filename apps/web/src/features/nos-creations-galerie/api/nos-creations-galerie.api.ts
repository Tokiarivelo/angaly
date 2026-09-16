import { useQuery } from '@tanstack/react-query';
import type { CategoryDto, CreationDto, Locale, PaginatedResponse } from '@angaly/types';

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

/**
 * Local response shape mirroring `PublicPageSectionResponseDto`
 * (`apps/api/src/content`) — same duplication convention as
 * `home/api/home.api.ts#PublicPageSectionDto` / `a-propos/api/a-propos.api.ts` /
 * `la-une/api/la-une.api.ts`. No `status`/`updatedById` — the public endpoint
 * never returns them.
 */
export interface PublicPageSectionDto {
  page: string;
  sectionKey: string;
  locale: Locale;
  titleText: string | null;
  subtitleText: string | null;
  bodyText: string | null;
  ctaPrimaryLabel: string | null;
  ctaSecondaryLabel: string | null;
  dataJson: unknown;
  mediaId: string | null;
  updatedAt: string;
}

/**
 * Real endpoint — see docs/features/content.md ("Endpoint public"). Public,
 * unauthenticated, PUBLISHED-only sections for the `nos-creations-galerie`
 * page — fourth page of the docs/phases/phase-6-admin-cms.md step 4 slice
 * (after `home`, `a-propos`, `la-une`). `useGalleryContent` merges these
 * onto the hardcoded header defaults by `sectionKey`.
 */
export function useGallerySectionsContentQuery() {
  return useQuery({
    queryKey: ['nos-creations-galerie', 'content'],
    queryFn: () => apiClient.get<PublicPageSectionDto[]>('/content/public/nos-creations-galerie'),
  });
}
