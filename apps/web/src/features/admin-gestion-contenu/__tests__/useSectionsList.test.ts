import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ContentStatus, Locale } from '@angaly/types';

import { useSectionsList } from '../hooks/useSectionsList';
import { withQueryClient } from '@/lib/test-utils';
import { apiClient } from '@/lib/api-client';

vi.mock('@/lib/api-client');

describe('useSectionsList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches the sections grouped by page', async () => {
    vi.mocked(apiClient.get).mockResolvedValueOnce([
      {
        page: 'accueil',
        sections: [
          { sectionKey: 'hero', status: ContentStatus.DRAFT, updatedAt: '2026-01-01T00:00:00.000Z', locales: [Locale.FR] },
        ],
      },
    ]);

    const { result } = renderHook(() => useSectionsList(), { wrapper: withQueryClient() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(apiClient.get).toHaveBeenCalledWith('/api/content/sections');
    expect(result.current.data).toHaveLength(1);
    expect(result.current.data?.[0]?.sections[0]?.sectionKey).toBe('hero');
  });

  it('surfaces the error state when the request fails', async () => {
    vi.mocked(apiClient.get).mockRejectedValueOnce(new Error('network error'));

    const { result } = renderHook(() => useSectionsList(), { wrapper: withQueryClient() });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});
