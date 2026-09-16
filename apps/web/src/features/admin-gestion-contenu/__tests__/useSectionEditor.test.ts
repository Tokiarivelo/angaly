import { renderHook, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ContentStatus, Locale } from '@angaly/types';

import { useSectionEditor } from '../hooks/useSectionEditor';
import { withQueryClient } from '@/lib/test-utils';
import { apiClient } from '@/lib/api-client';

vi.mock('@/lib/api-client');

const SECTION_FR = {
  id: 'section-1',
  page: 'accueil',
  sectionKey: 'hero',
  locale: Locale.FR,
  titleText: 'Bienvenue',
  subtitleText: null,
  bodyText: null,
  ctaPrimaryLabel: null,
  ctaSecondaryLabel: null,
  dataJson: null,
  mediaId: null,
  status: ContentStatus.DRAFT,
  updatedById: null,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

describe('useSectionEditor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('loads every existing locale row and exposes the one matching activeLocale', async () => {
    vi.mocked(apiClient.get).mockResolvedValueOnce([SECTION_FR]);

    const { result } = renderHook(() => useSectionEditor('accueil', 'hero', Locale.FR), {
      wrapper: withQueryClient(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(apiClient.get).toHaveBeenCalledWith('/api/content/sections/accueil/hero');
    expect(result.current.activeSection?.titleText).toBe('Bienvenue');
  });

  it('derives availableLocales from every existing locale row', async () => {
    vi.mocked(apiClient.get).mockResolvedValueOnce([SECTION_FR]);

    const { result } = renderHook(() => useSectionEditor('accueil', 'hero', Locale.FR), {
      wrapper: withQueryClient(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.availableLocales).toEqual([Locale.FR]);
  });

  it('returns null activeSection when the active locale has no row yet', async () => {
    vi.mocked(apiClient.get).mockResolvedValueOnce([SECTION_FR]);

    const { result } = renderHook(() => useSectionEditor('accueil', 'hero', Locale.MG), {
      wrapper: withQueryClient(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.activeSection).toBeNull();
  });

  it('saveDraft sends a PATCH scoped to the active locale', async () => {
    vi.mocked(apiClient.get).mockResolvedValueOnce([SECTION_FR]);
    vi.mocked(apiClient.patch).mockResolvedValueOnce({ ...SECTION_FR, titleText: 'Nouveau titre' });

    const { result } = renderHook(() => useSectionEditor('accueil', 'hero', Locale.FR), {
      wrapper: withQueryClient(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    act(() => {
      result.current.saveDraft.mutate({ titleText: 'Nouveau titre' });
    });

    await waitFor(() => expect(result.current.saveDraft.isSuccess).toBe(true));

    expect(apiClient.patch).toHaveBeenCalledWith('/api/content/sections/accueil/hero', {
      titleText: 'Nouveau titre',
      locale: Locale.FR,
    });
  });

  it('publish sends a POST for the active locale', async () => {
    vi.mocked(apiClient.get).mockResolvedValueOnce([SECTION_FR]);
    vi.mocked(apiClient.post).mockResolvedValueOnce({ ...SECTION_FR, status: ContentStatus.PUBLISHED });

    const { result } = renderHook(() => useSectionEditor('accueil', 'hero', Locale.FR), {
      wrapper: withQueryClient(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    act(() => {
      result.current.publish.mutate();
    });

    await waitFor(() => expect(result.current.publish.isSuccess).toBe(true));

    expect(apiClient.post).toHaveBeenCalledWith('/api/content/sections/accueil/hero/publish', { locale: Locale.FR });
  });
});
