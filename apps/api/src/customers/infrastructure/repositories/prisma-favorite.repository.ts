import { Injectable } from '@nestjs/common';
import { Prisma } from '@angaly/database';

import { PrismaService } from '../../../prisma/prisma.service';
import { FavoriteEntity, FavoriteEntityType } from '../../domain/entities/favorite.entity';
import { IFavoriteRepository } from '../../domain/repositories/favorite.repository';
import { FavoriteMapper } from '../mappers/favorite.mapper';

export const FAVORITE_SELECT = {
  id: true,
  customerId: true,
  entityType: true,
  entityId: true,
  createdAt: true,
} satisfies Prisma.FavoriteSelect;

export type FavoriteRecord = Prisma.FavoriteGetPayload<{ select: typeof FAVORITE_SELECT }>;

@Injectable()
export class PrismaFavoriteRepository implements IFavoriteRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<FavoriteEntity | null> {
    const record = await this.prisma.favorite.findUnique({ where: { id }, select: FAVORITE_SELECT });
    return record ? FavoriteMapper.toDomain(record) : null;
  }

  async findByCustomerAndEntity(
    customerId: string,
    entityType: FavoriteEntityType,
    entityId: string,
  ): Promise<FavoriteEntity | null> {
    const record = await this.prisma.favorite.findUnique({
      where: { customerId_entityType_entityId: { customerId, entityType, entityId } },
      select: FAVORITE_SELECT,
    });
    return record ? FavoriteMapper.toDomain(record) : null;
  }

  async create(customerId: string, entityType: FavoriteEntityType, entityId: string): Promise<FavoriteEntity> {
    const record = await this.prisma.favorite.create({
      data: { customerId, entityType, entityId },
      select: FAVORITE_SELECT,
    });
    return FavoriteMapper.toDomain(record);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.favorite.delete({ where: { id } });
  }

  async listByCustomer(customerId: string): Promise<FavoriteEntity[]> {
    const records = await this.prisma.favorite.findMany({
      where: { customerId },
      select: FAVORITE_SELECT,
      orderBy: { createdAt: 'desc' },
    });
    return records.map((record) => FavoriteMapper.toDomain(record));
  }
}
