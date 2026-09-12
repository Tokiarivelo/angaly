import { renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useRemoveFavorite } from '../hooks/useRemoveFavorite';
import { apiClient } from '@/lib/api-client';
import { withQueryClient } from '@/lib/test-utils';

vi.mock('@/lib/api-client', () => ({
  apiClient: {
    delete: vi.fn(),
  },
}));

describe('useRemoveFavorite', () => {
  it('should remove a favorite', async () => {
    vi.mocked(apiClient.delete).mockResolvedValueOnce({ data: null });

    const { result } = renderHook(() => useRemoveFavorite(), { wrapper: withQueryClient() });

    result.current.mutate('fav_1');

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(apiClient.delete).toHaveBeenCalledWith('/api/favorites/fav_1');
  });
});
