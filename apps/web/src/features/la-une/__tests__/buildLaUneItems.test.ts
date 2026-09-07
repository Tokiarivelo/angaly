import { describe, expect, it } from 'vitest';
import { CreationAvailability, type CollectionDto, type CreationDto } from '@angaly/types';

import { buildLaUneItems } from '../utils/buildLaUneItems';

function makeCreation(overrides: Partial<CreationDto> = {}): CreationDto {
  return {
    id: 'creation-1',
    slug: 'robe-eternelle',
    name: 'Robe Éternelle',
    description: 'Une robe de mariée intemporelle.',
    materials: null,
    techniques: null,
    availability: CreationAvailability.PIECE_UNIQUE,
    reproducible: true,
    isFeatured: true,
    featuredFrom: '2026-01-01T00:00:00.000Z',
    featuredUntil: null,
    category: { id: 'cat-1', slug: 'robes-de-mariee', name: 'Robes de mariée' },
    collection: null,
    media: [],
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

function makeCollection(overrides: Partial<CollectionDto> = {}): CollectionDto {
  return {
    id: 'collection-1',
    slug: 'collection-eclat',
    name: 'Collection Éclat',
    description: 'La nouvelle collection.',
    story: null,
    seasonYear: 2026,
    publishedAt: '2026-01-01T00:00:00.000Z',
    media: [],
    creationsCount: 3,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

describe('buildLaUneItems', () => {
  it('tags the first creation as "creation-du-mois" when there is no featured collection', () => {
    const items = buildLaUneItems([makeCreation()], null);

    expect(items).toHaveLength(1);
    expect(items[0]?.contentType).toBe('creation-du-mois');
    expect(items[0]?.href).toBe('/creations/robe-eternelle');
  });

  it('puts the featured collection first as the hero when one is published', () => {
    const items = buildLaUneItems([makeCreation()], makeCollection());

    expect(items).toHaveLength(2);
    expect(items[0]?.id).toBe('collection-1');
    expect(items[0]?.contentType).toBe('collection-du-moment');
    expect(items[0]?.href).toBe('/collections/collection-eclat');
    // The creation is no longer auto-tagged "creation-du-mois" once a collection leads —
    // it falls back to its category-derived tag instead ("mariage" here).
    expect(items[1]?.contentType).toBe('mariage');
  });

  it('derives "mariage" and "costume" content types from the category name', () => {
    const items = buildLaUneItems(
      [
        makeCreation({ id: 'c1', category: { id: 'cat-1', slug: 'robes-de-mariee', name: 'Robes de mariée' } }),
        makeCreation({ id: 'c2', category: { id: 'cat-2', slug: 'costumes', name: 'Costumes' } }),
      ],
      makeCollection(),
    );

    expect(items[1]?.contentType).toBe('mariage');
    expect(items[2]?.contentType).toBe('costume');
  });

  it('returns an empty list when there is no data at all', () => {
    expect(buildLaUneItems([], null)).toEqual([]);
  });
});
