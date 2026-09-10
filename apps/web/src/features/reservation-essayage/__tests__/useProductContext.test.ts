import { renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { withQueryClient } from '@/lib/test-utils';

import { useProductContext } from '../hooks/useProductContext';

let currentSearchParams = new URLSearchParams();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => '/essayage/reserver',
  useSearchParams: () => currentSearchParams,
}));

describe('useProductContext', () => {
  it('reads productId and size from the URL and loads the product summary', async () => {
    currentSearchParams = new URLSearchParams('productId=product-1&size=36');

    const { result } = renderHook(() => useProductContext(), { wrapper: withQueryClient() });

    expect(result.current.productId).toBe('product-1');
    expect(result.current.sizeFromUrl).toBe('36');

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.product?.name).toBe('Robe Solène');
  });

  it('has an empty productId/sizeFromUrl and no query when reached without params', () => {
    currentSearchParams = new URLSearchParams();

    const { result } = renderHook(() => useProductContext(), { wrapper: withQueryClient() });

    expect(result.current.productId).toBe('');
    expect(result.current.sizeFromUrl).toBe('');
    expect(result.current.product).toBeNull();
  });
});
