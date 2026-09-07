import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { useGalleryFilters } from '../hooks/useGalleryFilters';

describe('useGalleryFilters', () => {
  it('starts with the newest sort and the grid view', () => {
    const { result } = renderHook(() => useGalleryFilters());

    expect(result.current.sort).toBe('newest');
    expect(result.current.view).toBe('grid');
  });

  it('updates sort and view independently', () => {
    const { result } = renderHook(() => useGalleryFilters());

    act(() => result.current.setSort('featured'));
    expect(result.current.sort).toBe('featured');
    expect(result.current.view).toBe('grid');

    act(() => result.current.setView('list'));
    expect(result.current.view).toBe('list');
    expect(result.current.sort).toBe('featured');
  });
});
