import type { FavoriteEntity, FavoriteEntityType } from '../entities/favorite.entity';

export const FAVORITE_REPOSITORY = Symbol('IFavoriteRepository');

export interface IFavoriteRepository {
  findById: (id: string) => Promise<FavoriteEntity | null>;
  findByCustomerAndEntity: (
    customerId: string,
    entityType: FavoriteEntityType,
    entityId: string,
  ) => Promise<FavoriteEntity | null>;
  /** Idempotent: callers should check findByCustomerAndEntity first (see add-favorite.use-case.ts) rather than relying on a DB conflict. */
  create: (customerId: string, entityType: FavoriteEntityType, entityId: string) => Promise<FavoriteEntity>;
  delete: (id: string) => Promise<void>;
  listByCustomer: (customerId: string) => Promise<FavoriteEntity[]>;
}
