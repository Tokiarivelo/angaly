import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { useGalleryLightbox } from '../hooks/useGalleryLightbox';

describe('useGalleryLightbox', () => {
  it('starts closed on the first image', () => {
    const { result } = renderHook(() => useGalleryLightbox(3));
    expect(result.current.isOpen).toBe(false);
    expect(result.current.activeIndex).toBe(0);
  });

  it('opens and closes', () => {
    const { result } = renderHook(() => useGalleryLightbox(3));

    act(() => result.current.open());
    expect(result.current.isOpen).toBe(true);

    act(() => result.current.close());
    expect(result.current.isOpen).toBe(false);
  });

  it('ignores an out-of-range setActiveIndex', () => {
    const { result } = renderHook(() => useGalleryLightbox(2));

    act(() => result.current.setActiveIndex(5));
    expect(result.current.activeIndex).toBe(0);

    act(() => result.current.setActiveIndex(-1));
    expect(result.current.activeIndex).toBe(0);
  });

  it('cycles forward and wraps to the first image', () => {
    const { result } = renderHook(() => useGalleryLightbox(3));

    act(() => result.current.next());
    expect(result.current.activeIndex).toBe(1);
    act(() => result.current.next());
    expect(result.current.activeIndex).toBe(2);
    act(() => result.current.next());
    expect(result.current.activeIndex).toBe(0);
  });

  it('cycles backward and wraps to the last image', () => {
    const { result } = renderHook(() => useGalleryLightbox(3));

    act(() => result.current.previous());
    expect(result.current.activeIndex).toBe(2);
  });

  it('does nothing on next/previous with 0 or 1 media items', () => {
    const single = renderHook(() => useGalleryLightbox(1));
    act(() => single.result.current.next());
    act(() => single.result.current.previous());
    expect(single.result.current.activeIndex).toBe(0);

    const empty = renderHook(() => useGalleryLightbox(0));
    act(() => empty.result.current.next());
    expect(empty.result.current.activeIndex).toBe(0);
  });
});
