import { renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { useHomeContent } from '../hooks/useHomeContent';

describe('useHomeContent', () => {
  it('returns the static home content with no loading/error state', () => {
    const { result } = renderHook(() => useHomeContent());

    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.data.hero.headline).toBe('ANGALY');
    expect(result.current.data.categories.items).toHaveLength(4);
    expect(result.current.data.surMesure.steps).toHaveLength(7);
  });
});
