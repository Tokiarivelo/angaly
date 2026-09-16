import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MediaEntityType } from '@angaly/types';

import { useMediaLibrary } from '../hooks/useMediaLibrary';
import { withQueryClient } from '@/lib/test-utils';
import { apiClient } from '@/lib/api-client';

vi.mock('@/lib/api-client');

const SAMPLE_RESPONSE = {
  data: [
    {
      id: 'media-1',
      url: 'http://localhost:9000/creations/abc.jpg',
      altText: 'Robe éternelle',
      mimeType: 'image/jpeg',
      sizeBytes: 1024,
      width: 800,
      height: 600,
      entityType: MediaEntityType.CREATION,
      entityId: 'creation-1',
      sortOrder: 0,
      createdAt: '2026-01-01T00:00:00.000Z',
    },
  ],
  meta: { total: 1, page: 1, limit: 40, totalPages: 1, hasNextPage: false, hasPreviousPage: false },
};

describe('useMediaLibrary', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches the media list with folder/search/sort/page as query params', async () => {
    vi.mocked(apiClient.get).mockResolvedValueOnce(SAMPLE_RESPONSE);

    const { result } = renderHook(
      () => useMediaLibrary({ folderId: 'creations', search: 'robe', sortBy: 'recent', page: 1 }, MediaEntityType.CREATION),
      { wrapper: withQueryClient() },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(apiClient.get).toHaveBeenCalledWith(
      '/api/media?entityType=CREATION&search=robe&sortBy=recent&page=1&limit=40',
    );
    expect(result.current.data?.data).toHaveLength(1);
  });

  it('omits entityType when no folder is active ("Toutes")', async () => {
    vi.mocked(apiClient.get).mockResolvedValueOnce(SAMPLE_RESPONSE);

    const { result } = renderHook(
      () => useMediaLibrary({ folderId: 'toutes', search: '', sortBy: 'recent', page: 1 }, null),
      { wrapper: withQueryClient() },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(apiClient.get).toHaveBeenCalledWith('/api/media?sortBy=recent&page=1&limit=40');
  });
});
