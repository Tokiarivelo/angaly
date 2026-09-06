import { CollectionMapper } from '../../infrastructure/mappers/collection.mapper';
import type {
  CollectionDetailRecord,
  CollectionSummaryRecord,
} from '../../infrastructure/repositories/prisma-collection.repository';

function summaryRecord(overrides: Partial<CollectionSummaryRecord> = {}): CollectionSummaryRecord {
  return {
    id: 'collection-1',
    slug: 'eternelle',
    name: 'Éternelle',
    description: 'Une collection.',
    story: null,
    seasonYear: 2026,
    publishedAt: new Date('2026-01-01T00:00:00.000Z'),
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-02T00:00:00.000Z'),
    media: [{ id: 'media-1', url: 'http://localhost:9000/collections/a.jpg', altText: null, sortOrder: 0 }],
    _count: { creations: 5 },
    ...overrides,
  };
}

function detailRecord(): CollectionDetailRecord {
  return {
    ...summaryRecord(),
    creations: [
      {
        id: 'creation-1',
        slug: 'robe-eternelle',
        name: 'Robe Éternelle',
        media: [{ url: 'http://localhost:9000/creations/cover.jpg' }],
      },
      { id: 'creation-2', slug: 'costume-eternel', name: 'Costume Éternel', media: [] },
    ],
  };
}

describe('CollectionMapper', () => {
  it('toDomainSummary() maps creationsCount from _count and leaves creations null', () => {
    const entity = CollectionMapper.toDomainSummary(summaryRecord());

    expect(entity.creationsCount).toBe(5);
    expect(entity.creations).toBeNull();
    expect(entity.media[0]?.altText).toBe('');
  });

  it('toDomainDetail() maps creations with their cover image (or null when no media)', () => {
    const entity = CollectionMapper.toDomainDetail(detailRecord());

    expect(entity.creations).toEqual([
      { id: 'creation-1', slug: 'robe-eternelle', name: 'Robe Éternelle', coverImageUrl: 'http://localhost:9000/creations/cover.jpg' },
      { id: 'creation-2', slug: 'costume-eternel', name: 'Costume Éternel', coverImageUrl: null },
    ]);
  });

  it('toResponseDto() never exposes a creations field', () => {
    const entity = CollectionMapper.toDomainSummary(summaryRecord());
    const dto = CollectionMapper.toResponseDto(entity);

    expect(dto).not.toHaveProperty('creations');
    expect(dto.creationsCount).toBe(5);
    expect(dto.publishedAt).toBe('2026-01-01T00:00:00.000Z');
  });

  it('toDetailResponseDto() includes the mapped creations array', () => {
    const entity = CollectionMapper.toDomainDetail(detailRecord());
    const dto = CollectionMapper.toDetailResponseDto(entity);

    expect(dto.creations).toHaveLength(2);
    expect(dto.creationsCount).toBe(5);
  });

  it('toResponseDto() maps a null publishedAt to null (unpublished/draft collection)', () => {
    const entity = CollectionMapper.toDomainSummary(summaryRecord({ publishedAt: null }));
    const dto = CollectionMapper.toResponseDto(entity);

    expect(dto.publishedAt).toBeNull();
  });

  it('toDetailResponseDto() defaults creations to an empty array when the entity has none loaded', () => {
    const entity = CollectionMapper.toDomainSummary(summaryRecord());
    const dto = CollectionMapper.toDetailResponseDto(entity);

    expect(dto.creations).toEqual([]);
  });
});
