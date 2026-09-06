import {
  isMediaEntityType,
  MediaEntityRef,
  resolveBucketForEntityType,
} from '../../domain/value-objects/media-entity-ref.vo';

describe('isMediaEntityType', () => {
  it('accepts every known entity type', () => {
    expect(isMediaEntityType('CREATION')).toBe(true);
    expect(isMediaEntityType('PAGE_SECTION')).toBe(true);
  });

  it('rejects an unknown entity type', () => {
    expect(isMediaEntityType('NOT_A_TYPE')).toBe(false);
  });
});

describe('resolveBucketForEntityType', () => {
  it.each([
    ['CREATION', 'creations'],
    ['PRODUCT', 'products'],
    ['COLLECTION', 'collections'],
    ['ATELIER', 'ateliers'],
    ['CUSTOMER_AVATAR', 'avatars'],
    ['PATTERN_EXPORT', 'patterns'],
    ['BLOG_POST', 'blog'],
    ['PAGE_SECTION', 'customers'],
  ] as const)('maps %s to bucket %s', (entityType, bucket) => {
    expect(resolveBucketForEntityType(entityType)).toBe(bucket);
  });
});

describe('MediaEntityRef', () => {
  it('creates a ref with a null entityId', () => {
    const ref = MediaEntityRef.create('CREATION', null);
    expect(ref.entityType).toBe('CREATION');
    expect(ref.entityId).toBeNull();
  });

  it('creates a ref with a populated entityId', () => {
    const ref = MediaEntityRef.create('BLOG_POST', 'post-1');
    expect(ref.entityId).toBe('post-1');
  });

  it('rejects an invalid entityType', () => {
    expect(() => MediaEntityRef.create('NOT_A_TYPE', null)).toThrow(
      'Invalid MediaEntityType: NOT_A_TYPE',
    );
  });

  it('rejects an empty-string entityId', () => {
    expect(() => MediaEntityRef.create('CREATION', '   ')).toThrow(
      'MediaEntityRef.entityId must not be an empty string',
    );
  });
});
