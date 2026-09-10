import { FavoriteEntity } from '../../domain/entities/favorite.entity';
import type { FavoriteRecord } from '../repositories/prisma-favorite.repository';

export class FavoriteMapper {
  static toDomain(record: FavoriteRecord): FavoriteEntity {
    return FavoriteEntity.create({
      id: record.id,
      customerId: record.customerId,
      entityType: record.entityType,
      entityId: record.entityId,
      createdAt: record.createdAt,
    });
  }
}
