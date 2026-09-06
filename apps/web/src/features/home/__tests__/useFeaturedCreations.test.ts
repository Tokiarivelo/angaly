import { renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { withQueryClient } from '@/lib/test-utils';

import { useFeaturedCreations } from '../hooks/useFeaturedCreations';

describe('useFeaturedCreations', () => {
  it('starts in a loading state with no data', () => {
    const { result } = renderHook(() => useFeaturedCreations(), { wrapper: withQueryClient() });

    expect(result.current.isLoading).toBe(true);
    expect(result.current.data).toEqual([]);
  });

  it('resolves with the featured creations from the API', async () => {
    const { result } = renderHook(() => useFeaturedCreations(), { wrapper: withQueryClient() });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.error).toBeNull();
    expect(result.current.data).toHaveLength(1);
    expect(result.current.data[0]?.slug).toBe('robe-eternelle');
  });
});
