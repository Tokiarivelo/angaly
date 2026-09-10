import { renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { withQueryClient } from '@/lib/test-utils';

import { useProduct } from '../hooks/useProduct';

describe('useProduct', () => {
  it('starts in a loading state with no product', () => {
    const { result } = renderHook(() => useProduct('robe-solene'), { wrapper: withQueryClient() });

    expect(result.current.isLoading).toBe(true);
    expect(result.current.product).toBeUndefined();
  });

  it('resolves with the product returned by the API (mocked via MSW)', async () => {
    const { result } = renderHook(() => useProduct('robe-solene'), { wrapper: withQueryClient() });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.product?.slug).toBe('robe-solene');
    expect(result.current.product?.variants).toHaveLength(2);
    expect(result.current.isError).toBe(false);
  });
});
