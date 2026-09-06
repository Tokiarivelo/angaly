import type { CollectionProps } from '../../domain/entities/collection.entity';
import { CollectionEntity } from '../../domain/entities/collection.entity';

function baseProps(): CollectionProps {
  return {
    id: 'collection-1',
    slug: 'eternelle',
    name: 'Éternelle',
    description: 'Une collection intemporelle.',
    story: 'L’histoire de la collection.',
    seasonYear: 2026,
    publishedAt: new Date('2020-01-01T00:00:00.000Z'),
    media: [{ id: 'media-1', url: 'http://localhost:9000/collections/a.jpg', altText: 'Vue', sortOrder: 0 }],
    creationsCount: 3,
    creations: null,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-02T00:00:00.000Z'),
  };
}

describe('CollectionEntity', () => {
  it('creates a valid entity and exposes its properties via getters', () => {
    const entity = CollectionEntity.create(baseProps());

    expect(entity.id).toBe('collection-1');
    expect(entity.slug).toBe('eternelle');
    expect(entity.seasonYear).toBe(2026);
    expect(entity.creationsCount).toBe(3);
    expect(entity.creations).toBeNull();
  });

  it('rejects an empty slug', () => {
    expect(() => CollectionEntity.create({ ...baseProps(), slug: '   ' })).toThrow(
      'Collection.slug must not be empty',
    );
  });

  describe('isPublished', () => {
    it('is true when publishedAt is in the past', () => {
      const entity = CollectionEntity.create({
        ...baseProps(),
        publishedAt: new Date(Date.now() - 1000),
      });
      expect(entity.isPublished).toBe(true);
    });

    it('is false when publishedAt is null', () => {
      const entity = CollectionEntity.create({ ...baseProps(), publishedAt: null });
      expect(entity.isPublished).toBe(false);
    });

    it('is false when publishedAt is in the future', () => {
      const entity = CollectionEntity.create({
        ...baseProps(),
        publishedAt: new Date(Date.now() + 100_000),
      });
      expect(entity.isPublished).toBe(false);
    });
  });
});
