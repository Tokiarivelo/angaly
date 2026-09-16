'use client';

import { useQuery } from '@tanstack/react-query';

import { fetchMediaDetail } from '../api/media.api';
import { mediaDetailKey } from '../consts/queryKeys';

/** Loads one media plus its resolved "Utilisée dans" cross-references. */
export const useMediaDetail = (id: string | null) => {
  return useQuery({
    queryKey: mediaDetailKey(id ?? 'none'),
    queryFn: () => fetchMediaDetail(id as string),
    enabled: Boolean(id),
  });
};
