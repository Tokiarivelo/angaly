'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { fetchSectionVersions, restoreSectionVersion } from '../api/page-sections.api';
import { SECTION_GROUPS_KEY, sectionVersionsKey } from '../consts/queryKeys';

/** Version-history drawer: list + "Restaurer" — `pageSectionId` is null until a locale row exists. */
export const useSectionVersionHistory = (pageSectionId: string | null) => {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: sectionVersionsKey(pageSectionId ?? 'none'),
    queryFn: () => fetchSectionVersions(pageSectionId as string),
    enabled: Boolean(pageSectionId),
  });

  const restore = useMutation({
    mutationFn: (versionId: string) => restoreSectionVersion(pageSectionId as string, versionId),
    onSuccess: () => {
      if (pageSectionId) {
        void queryClient.invalidateQueries({ queryKey: sectionVersionsKey(pageSectionId) });
      }
      void queryClient.invalidateQueries({ queryKey: SECTION_GROUPS_KEY });
    },
  });

  return { ...query, restore };
};
