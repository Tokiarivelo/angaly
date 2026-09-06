import { MediaEntity } from '../../domain/entities/media.entity';
import { MediaEntityRef } from '../../domain/value-objects/media-entity-ref.vo';

function baseProps() {
  return {
    id: 'media-1',
    bucket: 'creations',
    objectKey: 'abc123.jpg',
    url: 'http://localhost:9000/creations/abc123.jpg',
    altText: 'Robe éternelle portée en studio',
    mimeType: 'image/jpeg',
    sizeBytes: 1024,
    width: 800,
    height: 600,
    entityRef: MediaEntityRef.create('CREATION', 'creation-1'),
    sortOrder: 0,
    uploadedById: null,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
  };
}

describe('MediaEntity', () => {
  it('creates a valid entity and exposes its properties via getters', () => {
    const entity = MediaEntity.create(baseProps());

    expect(entity.id).toBe('media-1');
    expect(entity.bucket).toBe('creations');
    expect(entity.objectKey).toBe('abc123.jpg');
    expect(entity.url).toBe('http://localhost:9000/creations/abc123.jpg');
    expect(entity.altText).toBe('Robe éternelle portée en studio');
    expect(entity.mimeType).toBe('image/jpeg');
    expect(entity.sizeBytes).toBe(1024);
    expect(entity.width).toBe(800);
    expect(entity.height).toBe(600);
    expect(entity.entityRef.entityType).toBe('CREATION');
    expect(entity.sortOrder).toBe(0);
    expect(entity.uploadedById).toBeNull();
    expect(entity.createdAt).toEqual(new Date('2026-01-01T00:00:00.000Z'));
  });

  it('rejects an empty bucket', () => {
    expect(() => MediaEntity.create({ ...baseProps(), bucket: '  ' })).toThrow(
      'Media.bucket must not be empty',
    );
  });

  it('rejects an empty objectKey', () => {
    expect(() => MediaEntity.create({ ...baseProps(), objectKey: '' })).toThrow(
      'Media.objectKey must not be empty',
    );
  });

  it('rejects an empty altText (accessibility/SEO requirement)', () => {
    expect(() => MediaEntity.create({ ...baseProps(), altText: '   ' })).toThrow(
      'Media.altText is required',
    );
  });

  it('rejects a negative sizeBytes', () => {
    expect(() => MediaEntity.create({ ...baseProps(), sizeBytes: -1 })).toThrow(
      'Media.sizeBytes must not be negative',
    );
  });
});
