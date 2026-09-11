import type { CreationProps } from '../../domain/entities/creation.entity';
import { CreationEntity } from '../../domain/entities/creation.entity';

function baseProps(): CreationProps {
  return {
    id: 'creation-1',
    slug: 'robe-eternelle',
    name: 'Robe Éternelle',
    description: 'Une robe de mariée intemporelle.',
    materials: 'Soie, dentelle',
    techniques: 'Broderie main',
    genre: null,
    type: null,
    color: null,
    style: null,
    availability: 'PIECE_UNIQUE',
    reproducible: true,
    isFeatured: true,
    featuredFrom: new Date('2026-01-01T00:00:00.000Z'),
    featuredUntil: null,
    category: { id: 'cat-1', slug: 'robes-de-mariee', name: 'Robes de mariée' },
    collection: { id: 'coll-1', slug: 'eternelle', name: 'Éternelle' },
    media: [{ id: 'media-1', url: 'http://localhost:9000/creations/a.jpg', altText: 'Vue de face', sortOrder: 0 }],
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-02T00:00:00.000Z'),
  };
}

describe('CreationEntity', () => {
  it('creates a valid entity and exposes its properties via getters', () => {
    const entity = CreationEntity.create(baseProps());

    expect(entity.id).toBe('creation-1');
    expect(entity.slug).toBe('robe-eternelle');
    expect(entity.name).toBe('Robe Éternelle');
    expect(entity.availability).toBe('PIECE_UNIQUE');
    expect(entity.category.name).toBe('Robes de mariée');
    expect(entity.collection?.name).toBe('Éternelle');
    expect(entity.media).toHaveLength(1);
    expect(entity.reproducible).toBe(true);
    expect(entity.isFeatured).toBe(true);
  });

  it('accepts a null collection', () => {
    const entity = CreationEntity.create({ ...baseProps(), collection: null });
    expect(entity.collection).toBeNull();
  });

  it('rejects an empty slug', () => {
    expect(() => CreationEntity.create({ ...baseProps(), slug: '  ' })).toThrow(
      'Creation.slug must not be empty',
    );
  });

  it('rejects an empty name', () => {
    expect(() => CreationEntity.create({ ...baseProps(), name: '' })).toThrow(
      'Creation.name must not be empty',
    );
  });

  it('rejects an invalid availability', () => {
    expect(() => CreationEntity.create({ ...baseProps(), availability: 'NOT_REAL' })).toThrow(
      'Invalid CreationAvailability: NOT_REAL',
    );
  });
});
