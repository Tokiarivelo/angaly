'use client';

import { useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Locale } from '@angaly/types';

import {
  fetchSection,
  publishSection,
  saveSectionDraft,
} from '../api/page-sections.api';
import type { SaveSectionDraftInput } from '../api/page-sections.api';
import { SECTION_GROUPS_KEY, sectionKey, sectionVersionsKey } from '../consts/queryKeys';

/**
 * Loads every existing locale row for a (page, sectionKey) and exposes
 * save-draft/publish mutations scoped to one locale at a time — the caller
 * (SectionEditorForm) drives which locale is active via LocaleTabs.
 */
export const useSectionEditor = (page: string, sectionKeyValue: string, activeLocale: Locale) => {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: sectionKey(page, sectionKeyValue),
    queryFn: () => fetchSection(page, sectionKeyValue),
    enabled: Boolean(page && sectionKeyValue),
  });

  const activeSection = useMemo(
    () => query.data?.find((section) => section.locale === activeLocale) ?? null,
    [query.data, activeLocale],
  );

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: sectionKey(page, sectionKeyValue) });
    void queryClient.invalidateQueries({ queryKey: SECTION_GROUPS_KEY });
    if (activeSection) {
      void queryClient.invalidateQueries({ queryKey: sectionVersionsKey(activeSection.id) });
    }
  };

  const saveDraft = useMutation({
    mutationFn: (input: Omit<SaveSectionDraftInput, 'locale'>) =>
      saveSectionDraft(page, sectionKeyValue, { ...input, locale: activeLocale }),
    onSuccess: invalidate,
  });

  const publish = useMutation({
    mutationFn: () => publishSection(page, sectionKeyValue, activeLocale),
    onSuccess: invalidate,
  });

  return {
    ...query,
    activeSection,
    saveDraft,
    publish,
  };
};
