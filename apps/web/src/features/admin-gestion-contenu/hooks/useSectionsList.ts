'use client';

import { useQuery } from '@tanstack/react-query';

import { fetchSectionGroups } from '../api/page-sections.api';
import { SECTION_GROUPS_KEY } from '../consts/queryKeys';

/** Left column of `admin-gestion-contenu` — pages/sections grouped list with status pills. */
export const useSectionsList = () => {
  return useQuery({
    queryKey: SECTION_GROUPS_KEY,
    queryFn: fetchSectionGroups,
  });
};
