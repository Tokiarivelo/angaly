import { renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { useAProposContent } from '../hooks/useAProposContent';

describe('useAProposContent', () => {
  it('returns the static content with no loading/error state', () => {
    const { result } = renderHook(() => useAProposContent());

    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.data.hero.title).toBe('Notre histoire');
    expect(result.current.data.histoire.chronology).toHaveLength(2);
    expect(result.current.data.savoirFaire.items).toHaveLength(4);
    expect(result.current.data.atelier.items).toHaveLength(4);
  });

  it('keeps exactly 2 decorative icon tiles and 2 real-photo tiles in "Notre Savoir-Faire"', () => {
    const { result } = renderHook(() => useAProposContent());

    const withPhoto = result.current.data.savoirFaire.items.filter((item) => item.imageUrl !== null);
    const withIcon = result.current.data.savoirFaire.items.filter((item) => item.icon !== null);

    expect(withPhoto).toHaveLength(2);
    expect(withIcon).toHaveLength(2);
  });

  it('provides high-resolution media URLs for hero, histoire, fondatrice, and atelier', () => {
    const { result } = renderHook(() => useAProposContent());

    expect(result.current.data.hero.imageUrl).toBeTruthy();
    expect(result.current.data.hero.imageUrl).toMatch(/^https?:\/\//);
    expect(result.current.data.histoire.imageUrl).toBeTruthy();
    expect(result.current.data.fondatrice.imageUrl).toBeTruthy();
    expect(result.current.data.atelier.items.filter((i) => i.imageUrl !== null).length).toBe(3);
  });
});
