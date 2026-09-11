import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { CreationAvailability, type CreationDto } from '@angaly/types';

import { useQuickView } from '../hooks/useQuickView';

const CREATION: CreationDto = {
  id: 'c1',
  slug: 'c1',
  name: 'Création c1',
  description: '',
  materials: null,
  techniques: null,
  genre: 'Femme',
  type: 'Mariée',
  color: 'Blanc',
  style: 'Classique',
  availability: CreationAvailability.PIECE_UNIQUE,
  reproducible: true,
  isFeatured: false,
  featuredFrom: null,
  featuredUntil: null,
  category: { id: 'cat-1', slug: 'robes', name: 'Robes' },
  collection: null,
  media: [],
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

describe('useQuickView', () => {
  it('starts with no active creation', () => {
    const { result } = renderHook(() => useQuickView());
    expect(result.current.activeCreation).toBeNull();
  });

  it('opens with the given creation and closes back to null', () => {
    const { result } = renderHook(() => useQuickView());

    act(() => result.current.open(CREATION));
    expect(result.current.activeCreation).toEqual(CREATION);

    act(() => result.current.close());
    expect(result.current.activeCreation).toBeNull();
  });
});
