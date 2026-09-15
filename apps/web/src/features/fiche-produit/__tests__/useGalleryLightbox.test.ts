import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { useGalleryLightbox } from '../hooks/useGalleryLightbox';

describe('useGalleryLightbox', () => {
  it('starts on the first image, closed', () => {
    const { result } = renderHook(() => useGalleryLightbox(3));
    expect(result.current.activeIndex).toBe(0);
    expect(result.current.isOpen).toBe(false);
  });

  it('ignores setActiveIndex calls outside the media bounds', () => {
    const { result } = renderHook(() => useGalleryLightbox(3));

    act(() => result.current.setActiveIndex(2));
    expect(result.current.activeIndex).toBe(2);

    act(() => result.current.setActiveIndex(5));
    expect(result.current.activeIndex).toBe(2);

    act(() => result.current.setActiveIndex(-1));
    expect(result.current.activeIndex).toBe(2);
  });

  it('wraps around with next/previous', () => {
    const { result } = renderHook(() => useGalleryLightbox(3));

    act(() => result.current.setActiveIndex(2));
    act(() => result.current.next());
    expect(result.current.activeIndex).toBe(0);

    act(() => result.current.previous());
    expect(result.current.activeIndex).toBe(2);
  });

  it('open/close toggles isOpen', () => {
    const { result } = renderHook(() => useGalleryLightbox(2));

    act(() => result.current.open());
    expect(result.current.isOpen).toBe(true);

    act(() => result.current.close());
    expect(result.current.isOpen).toBe(false);
  });

  it('clamps activeIndex back to 0 when mediaCount shrinks below it — switching to a color with fewer photos while viewing a later one', () => {
    const { result, rerender } = renderHook(({ mediaCount }) => useGalleryLightbox(mediaCount), {
      initialProps: { mediaCount: 4 },
    });

    act(() => result.current.setActiveIndex(3));
    expect(result.current.activeIndex).toBe(3);

    rerender({ mediaCount: 2 });
    expect(result.current.activeIndex).toBe(0);
  });

  it('keeps the current activeIndex when mediaCount shrinks but still covers it', () => {
    const { result, rerender } = renderHook(({ mediaCount }) => useGalleryLightbox(mediaCount), {
      initialProps: { mediaCount: 4 },
    });

    act(() => result.current.setActiveIndex(1));
    rerender({ mediaCount: 2 });
    expect(result.current.activeIndex).toBe(1);
  });
});
