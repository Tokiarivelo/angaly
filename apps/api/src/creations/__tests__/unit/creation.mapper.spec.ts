import { CreationMapper } from '../../infrastructure/mappers/creation.mapper';
import type { CreationRecord } from '../../infrastructure/repositories/prisma-creation.repository';

function creationRecord(overrides: Partial<CreationRecord> = {}): CreationRecord {
  return {
    id: 'creation-1',
    slug: 'robe-eternelle',
    name: 'Robe Éternelle',
    description: 'Une robe intemporelle.',
    materials: 'Soie',
    techniques: 'Broderie',
    availability: 'PIECE_UNIQUE',
    reproducible: true,
    isFeatured: true,
    featuredFrom: new Date('2026-01-01T00:00:00.000Z'),
    featuredUntil: null,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-02T00:00:00.000Z'),
    category: { id: 'cat-1', slug: 'robes', name: 'Robes' },
    collection: { id: 'coll-1', slug: 'eternelle', name: 'Éternelle' },
    genre: null,
    type: null,
    color: null,
    style: null,
    media: [{ id: 'media-1', url: 'http://localhost:9000/creations/a.jpg', altText: null, sortOrder: 0 }],
    ...overrides,
  };
}

describe('CreationMapper', () => {
  it('maps a Prisma record to a domain entity, defaulting a null media altText to an empty string', () => {
    const entity = CreationMapper.toDomain(creationRecord());

    expect(entity.id).toBe('creation-1');
    expect(entity.category.name).toBe('Robes');
    expect(entity.collection?.name).toBe('Éternelle');
    expect(entity.media[0]?.altText).toBe('');
  });

  it('maps a domain entity to a response DTO with ISO date strings', () => {
    const entity = CreationMapper.toDomain(creationRecord());
    const dto = CreationMapper.toResponseDto(entity);

    expect(dto.featuredFrom).toBe('2026-01-01T00:00:00.000Z');
    expect(dto.featuredUntil).toBeNull();
    expect(dto.createdAt).toBe('2026-01-01T00:00:00.000Z');
    expect(dto.collection).toEqual({ id: 'coll-1', slug: 'eternelle', name: 'Éternelle' });
  });

  it('maps a record with no collection to a null collection DTO', () => {
    const entity = CreationMapper.toDomain(creationRecord({ collection: null }));
    const dto = CreationMapper.toResponseDto(entity);

    expect(dto.collection).toBeNull();
  });
});
