import { Injectable } from '@nestjs/common';
import { Prisma } from '@angaly/database';

import { PrismaService } from '../../../prisma/prisma.service';
import { CategoryEntity } from '../../domain/entities/category.entity';
import { ICategoryRepository } from '../../domain/repositories/category.repository';
import type { CategoryKind } from '../../domain/value-objects/category-kind.vo';
import { CategoryMapper } from '../mappers/category.mapper';

export const CATEGORY_SELECT = {
  id: true,
  slug: true,
  name: true,
  kind: true,
} satisfies Prisma.CategorySelect;

export type CategoryRecord = Prisma.CategoryGetPayload<{ select: typeof CATEGORY_SELECT }>;

@Injectable()
export class PrismaCategoryRepository implements ICategoryRepository {
  constructor(private readonly prisma: PrismaService) {}

  async list(kind?: CategoryKind): Promise<CategoryEntity[]> {
    const records = await this.prisma.category.findMany({
      select: CATEGORY_SELECT,
      where: kind ? { kind } : undefined,
      orderBy: { name: 'asc' },
    });
    return records.map((record) => CategoryMapper.toDomain(record));
  }
}
