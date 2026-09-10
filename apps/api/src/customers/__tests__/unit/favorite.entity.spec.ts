import type { FavoriteProps } from '../../domain/entities/favorite.entity';
import { FavoriteEntity } from '../../domain/entities/favorite.entity';

function baseProps(): FavoriteProps {
  return {
    id: 'favorite-1',
    customerId: 'customer-1',
    entityType: 'CREATION',
    entityId: 'creation-1',
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
  };
}

describe('FavoriteEntity', () => {
  it('creates a valid entity and exposes its properties via getters', () => {
    const entity = FavoriteEntity.create(baseProps());

    expect(entity.id).toBe('favorite-1');
    expect(entity.customerId).toBe('customer-1');
    expect(entity.entityType).toBe('CREATION');
    expect(entity.entityId).toBe('creation-1');
  });

  it.each(['CREATION', 'PRODUCT', 'COLLECTION'] as const)('accepts entityType %s', (entityType) => {
    expect(() => FavoriteEntity.create({ ...baseProps(), entityType })).not.toThrow();
  });

  it('rejects an unknown entityType', () => {
    expect(() =>
      FavoriteEntity.create({ ...baseProps(), entityType: 'UNKNOWN' as FavoriteProps['entityType'] }),
    ).toThrow('Favorite.entityType must be one of CREATION, PRODUCT, COLLECTION');
  });

  it('rejects an empty entityId', () => {
    expect(() => FavoriteEntity.create({ ...baseProps(), entityId: '' })).toThrow(
      'Favorite.entityId must not be empty',
    );
  });
});
