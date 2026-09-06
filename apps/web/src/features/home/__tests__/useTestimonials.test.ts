import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { withQueryClient } from '@/lib/test-utils';

import { useTestimonials } from '../hooks/useTestimonials';

describe('useTestimonials', () => {
  it('starts at index 0 with no active testimonial while loading', () => {
    const { result } = renderHook(() => useTestimonials(), { wrapper: withQueryClient() });

    expect(result.current.activeIndex).toBe(0);
    expect(result.current.activeTestimonial).toBeNull();
  });

  it('navigates forward, wrapping around at the end', async () => {
    const { result } = renderHook(() => useTestimonials(), { wrapper: withQueryClient() });
    await waitFor(() => expect(result.current.data).toHaveLength(3));

    act(() => result.current.goToNext());
    expect(result.current.activeIndex).toBe(1);

    act(() => result.current.goToNext());
    act(() => result.current.goToNext());
    expect(result.current.activeIndex).toBe(0);
  });

  it('navigates backward, wrapping around at the start', async () => {
    const { result } = renderHook(() => useTestimonials(), { wrapper: withQueryClient() });
    await waitFor(() => expect(result.current.data).toHaveLength(3));

    act(() => result.current.goToPrevious());
    expect(result.current.activeIndex).toBe(2);
  });

  it('jumps directly to an index', async () => {
    const { result } = renderHook(() => useTestimonials(), { wrapper: withQueryClient() });
    await waitFor(() => expect(result.current.data).toHaveLength(3));

    act(() => result.current.goToIndex(2));
    expect(result.current.activeIndex).toBe(2);
    expect(result.current.activeTestimonial?.id).toBe('testimonial-3');
  });
});
