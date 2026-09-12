import { renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useFavorites } from '../hooks/useFavorites';
import { apiClient } from '@/lib/api-client';
import { withQueryClient } from '@/lib/test-utils';
import { FavoriteEntityType } from '@angaly/types';

vi.mock('@/lib/api-client', () => ({
  apiClient: {
    get: vi.fn(),
  },
}));

describe('useFavorites', () => {
  it('should fetch favorites', async () => {
    const mockFavorites = [
      { id: '1', entityType: FavoriteEntityType.CREATION, entityId: 'c1', createdAt: '2023-01-01', display: { name: 'Test', slug: 'test', imageUrl: null } },
    ];
    vi.mocked(apiClient.get).mockResolvedValueOnce(mockFavorites as any);

    const { result } = renderHook(() => useFavorites('ALL'), { wrapper: withQueryClient() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(mockFavorites);
    expect(apiClient.get).toHaveBeenCalledWith('/api/favorites');
  });

  it('should pass type parameter', async () => {
    vi.mocked(apiClient.get).mockResolvedValueOnce([] as any);

    const { result } = renderHook(() => useFavorites('CREATION'), { wrapper: withQueryClient() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(apiClient.get).toHaveBeenCalledWith('/api/favorites?type=CREATION');
  });
});
