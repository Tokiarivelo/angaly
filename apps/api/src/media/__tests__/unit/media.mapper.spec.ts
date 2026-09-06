import type { Media as PrismaMedia } from '@angaly/database';

import { MediaMapper } from '../../infrastructure/mappers/media.mapper';

function prismaRecord(overrides: Partial<PrismaMedia> = {}): PrismaMedia {
  return {
    id: 'media-1',
    bucket: 'creations',
    objectKey: 'abc.jpg',
    url: 'http://localhost:9000/creations/abc.jpg',
    altText: 'Robe éternelle',
    mimeType: 'image/jpeg',
    sizeBytes: 100,
    width: 800,
    height: 600,
    entityType: 'CREATION',
    entityId: 'creation-1',
    sortOrder: 0,
    uploadedById: null,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    ...overrides,
  };
}

describe('MediaMapper', () => {
  it('maps a Prisma record to a domain entity', () => {
    const entity = MediaMapper.toDomain(prismaRecord());

    expect(entity.id).toBe('media-1');
    expect(entity.entityRef.entityType).toBe('CREATION');
    expect(entity.entityRef.entityId).toBe('creation-1');
  });

  it('rejects a Prisma record with a null altText — the entity invariant still applies at the boundary', () => {
    expect(() => MediaMapper.toDomain(prismaRecord({ altText: null }))).toThrow(
      'Media.altText is required',
    );
  });

  it('maps a domain entity to a response DTO', () => {
    const entity = MediaMapper.toDomain(prismaRecord());
    const dto = MediaMapper.toResponseDto(entity);

    expect(dto).toEqual({
      id: 'media-1',
      url: 'http://localhost:9000/creations/abc.jpg',
      altText: 'Robe éternelle',
      mimeType: 'image/jpeg',
      sizeBytes: 100,
      width: 800,
      height: 600,
      entityType: 'CREATION',
      entityId: 'creation-1',
      sortOrder: 0,
      createdAt: '2026-01-01T00:00:00.000Z',
    });
  });
});
