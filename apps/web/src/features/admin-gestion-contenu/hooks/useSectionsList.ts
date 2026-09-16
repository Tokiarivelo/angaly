'use client';

import { useQuery } from '@tanstack/react-query';

import { fetchSectionGroups } from '../api/page-sections.api';
import { SECTION_GROUPS_KEY } from '../consts/queryKeys';

/** The section groups rarely change second-to-second — avoids a refetch on every re-mount within this window. */
const STALE_TIME_MS = 30_000;

/** Left column of `admin-gestion-contenu` — pages/sections grouped list with status pills. */
export const useSectionsList = () => {
  return useQuery({
    queryKey: SECTION_GROUPS_KEY,
    queryFn: fetchSectionGroups,
    staleTime: STALE_TIME_MS,
  });
};
