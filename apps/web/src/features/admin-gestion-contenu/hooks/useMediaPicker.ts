'use client';

import { useQuery } from '@tanstack/react-query';

import { fetchMediaList } from '../../admin-mediatheque/api/media.api';

const PICKER_PAGE_SIZE = 24;

/** Recent images from the media library (all folders), optionally filtered by a search term — feeds `MediaPickerDialog`. */
export const useMediaPicker = (isOpen: boolean, search: string) =>
  useQuery({
    queryKey: ['admin', 'content', 'media-picker', search] as const,
    queryFn: () => fetchMediaList({ ...(search ? { search } : {}), sortBy: 'recent', page: 1, limit: PICKER_PAGE_SIZE }),
    enabled: isOpen,
    staleTime: 30_000,
  });
