import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useSizeCharts } from '../hooks/useSizeCharts';
import { withQueryClient } from '@/lib/test-utils';
import { apiClient } from '@/lib/api-client';

vi.mock('@/lib/api-client');

describe('useSizeCharts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches the size chart for the requested gender', async () => {
    vi.mocked(apiClient.get).mockResolvedValueOnce([
      { label: 'S', frSize: '38', measurements: { TOUR_POITRINE: 88 } },
    ]);

    const { result } = renderHook(() => useSizeCharts('FEMME'), {
      wrapper: withQueryClient(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(apiClient.get).toHaveBeenCalledWith('/api/measurements/size-charts?gender=FEMME');
    expect(result.current.data).toEqual([
      { label: 'S', frSize: '38', measurements: { TOUR_POITRINE: 88 } },
    ]);
  });

  it('resolves to an empty array instead of throwing when the request fails', async () => {
    vi.mocked(apiClient.get).mockRejectedValueOnce(new Error('network error'));

    const { result } = renderHook(() => useSizeCharts('HOMME'), {
      wrapper: withQueryClient(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([]);
  });
});
