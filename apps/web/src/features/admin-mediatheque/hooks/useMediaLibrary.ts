'use client';

import { useQuery } from '@tanstack/react-query';
import type { MediaEntityType } from '@angaly/types';

import { fetchMediaList } from '../api/media.api';
import { mediaLibraryKey } from '../consts/queryKeys';
import type { MediaLibraryFilters } from '../consts/queryKeys';

const PAGE_SIZE = 40;
/** The library rarely changes second-to-second — avoids a refetch on every folder/tab revisit within this window. */
const STALE_TIME_MS = 30_000;

/** Paginated/filtered media list (folder/search/sort) for the main grid — see docs/pages/admin-mediatheque.md. */
export const useMediaLibrary = (
  filters: MediaLibraryFilters,
  entityType: MediaEntityType | null,
) => {
  return useQuery({
    queryKey: mediaLibraryKey(filters),
    queryFn: () =>
      fetchMediaList({
        ...(entityType ? { entityType } : {}),
        ...(filters.search ? { search: filters.search } : {}),
        sortBy: filters.sortBy,
        page: filters.page,
        limit: PAGE_SIZE,
      }),
    staleTime: STALE_TIME_MS,
  });
};
