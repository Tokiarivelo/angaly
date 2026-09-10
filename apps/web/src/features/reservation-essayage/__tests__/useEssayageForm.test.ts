import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { withQueryClient } from '@/lib/test-utils';

import { useEssayageForm } from '../hooks/useEssayageForm';

let currentSearchParams = new URLSearchParams();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => '/essayage/reserver',
  useSearchParams: () => currentSearchParams,
}));

describe('useEssayageForm', () => {
  it('prefills the size from the URL once the product context resolves it', async () => {
    currentSearchParams = new URLSearchParams('productId=product-1&size=36');

    const { result } = renderHook(() => useEssayageForm(), { wrapper: withQueryClient() });

    await waitFor(() => expect(result.current.size).toBe('36'));
  });

  it('selecting a different atelier resets the date and slot', async () => {
    currentSearchParams = new URLSearchParams();
    const { result } = renderHook(() => useEssayageForm(), { wrapper: withQueryClient() });

    act(() => result.current.selectAtelier('atelier-1'));
    act(() => result.current.selectDate('2026-09-14'));
    act(() => result.current.selectSlot('2026-09-14T09:00:00.000Z'));

    act(() => result.current.selectAtelier('atelier-2'));

    expect(result.current.date).toBe('');
    expect(result.current.scheduledAt).toBe('');
  });

  it('reports validation errors when submitting with nothing filled in', async () => {
    currentSearchParams = new URLSearchParams();
    const { result } = renderHook(() => useEssayageForm(), { wrapper: withQueryClient() });

    await act(async () => {
      await result.current.handleSubmit(result.current.onSubmit)();
    });

    await waitFor(() => expect(Object.keys(result.current.errors).length).toBeGreaterThan(0));
    expect(result.current.errors.size).toBeDefined();
    expect(result.current.errors.firstName).toBeDefined();
  });
});
