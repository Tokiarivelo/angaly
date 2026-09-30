'use client';

import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

import { apiClient } from '@/lib/api-client';
import { publicContentPath } from '@/lib/public-content';
import { useLocaleStore } from '@/stores/locale.store';

/** Public shape of a `PageSection` (`GET /content/public/:page`) — no `status`/`updatedById`. */
export interface CmsSection {
  page: string;
  sectionKey: string;
  locale: 'FR' | 'MG';
  titleText: string | null;
  subtitleText: string | null;
  bodyText: string | null;
  ctaPrimaryLabel: string | null;
  ctaSecondaryLabel: string | null;
  dataJson: unknown;
  mediaId: string | null;
  /** Image resolved server-side from `mediaId` (always the French row's — images are shared across languages). */
  media?: { id: string; url: string; altText: string | null } | null;
  updatedAt: string;
}

export interface CmsPage {
  /** A PUBLISHED section, or `undefined` when the CMS has none (the caller then uses its built-in default). */
  section: (sectionKey: string) => CmsSection | undefined;
  isLoading: boolean;
  error: Error | null;
}

/**
 * Locale-aware read of one page's PUBLISHED CMS sections. Pages merge them onto their built-in default copy
 * (`cmsText`/`cmsList`), so a missing or half-filled section never blanks the site.
 */
export function useCmsPage(page: string): CmsPage {
  const locale = useLocaleStore((state) => state.locale);
  const { data, isLoading, error } = useQuery({
    queryKey: ['cms', page, locale],
    queryFn: () => apiClient.get<CmsSection[]>(publicContentPath(page, locale)),
    staleTime: 30_000,
  });

  return useMemo(() => {
    const byKey = new Map((data ?? []).map((section) => [section.sectionKey, section]));
    return { section: (sectionKey: string) => byKey.get(sectionKey), isLoading, error };
  }, [data, isLoading, error]);
}
