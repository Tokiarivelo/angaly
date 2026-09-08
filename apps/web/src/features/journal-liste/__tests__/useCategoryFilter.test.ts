import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { useCategoryFilter } from '../hooks/useCategoryFilter';

describe('useCategoryFilter', () => {
  it('starts on "Tout" (null)', () => {
    const { result } = renderHook(() => useCategoryFilter());
    expect(result.current.activeSlug).toBeNull();
  });

  it('updates the active category slug', () => {
    const { result } = renderHook(() => useCategoryFilter());

    act(() => result.current.setActiveSlug('conseils-mode'));

    expect(result.current.activeSlug).toBe('conseils-mode');
  });
});
