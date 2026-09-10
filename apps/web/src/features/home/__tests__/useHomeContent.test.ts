import { renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { withQueryClient } from '@/lib/test-utils';

import { useHomeContent } from '../hooks/useHomeContent';

describe('useHomeContent', () => {
  it('returns the home content with hero, categories and images', () => {
    const { result } = renderHook(() => useHomeContent(), { wrapper: withQueryClient() });

    expect(result.current.data.hero.headline).toBe('ANGALY');
    expect(result.current.data.hero.imageUrl).toBeDefined();
    expect(result.current.data.maison.imageUrl).toBeDefined();
    expect(result.current.data.categories.items).toHaveLength(4);
    expect(result.current.data.categories.items[0]?.imageUrl).toBeDefined();
    expect(result.current.data.patternStudio.imageUrl).toBeDefined();
    expect(result.current.data.surMesure.steps).toHaveLength(7);
  });
});
