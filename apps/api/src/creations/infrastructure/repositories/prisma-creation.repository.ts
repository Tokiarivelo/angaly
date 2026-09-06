import { Injectable } from '@nestjs/common';
import { Prisma } from '@angaly/database';

import { PrismaService } from '../../../prisma/prisma.service';
import {
  CreationListFilter,
  CreationListResult,
  ICreationRepository,
} from '../../domain/repositories/creation.repository';
import { CreationEntity } from '../../domain/entities/creation.entity';
import { CreationMapper } from '../mappers/creation.mapper';

export const CREATION_DETAIL_SELECT = {
  id: true,
  slug: true,
  name: true,
  description: true,
  materials: true,
  techniques: true,
  availability: true,
  reproducible: true,
  isFeatured: true,
  featuredFrom: true,
  featuredUntil: true,
  createdAt: true,
  updatedAt: true,
  category: { select: { id: true, slug: true, name: true } },
  collection: { select: { id: true, slug: true, name: true } },
  media: {
    orderBy: { sortOrder: 'asc' },
    select: { id: true, url: true, altText: true, sortOrder: true },
  },
} satisfies Prisma.CreationSelect;

export type CreationRecord = Prisma.CreationGetPayload<{ select: typeof CREATION_DETAIL_SELECT }>;

function buildOrderBy(sort: CreationListFilter['sort']): Prisma.CreationOrderByWithRelationInput[] {
  if (sort === 'featured') {
    return [{ isFeatured: 'desc' }, { createdAt: 'desc' }];
  }
  return [{ createdAt: 'desc' }];
}

@Injectable()
export class PrismaCreationRepository implements ICreationRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findBySlug(slug: string): Promise<CreationEntity | null> {
    const record = await this.prisma.creation.findUnique({
      where: { slug },
      select: CREATION_DETAIL_SELECT,
    });
    return record ? CreationMapper.toDomain(record) : null;
  }

  async list(filter: CreationListFilter): Promise<CreationListResult> {
    const where: Prisma.CreationWhereInput = {
      ...(filter.categoryId ? { categoryId: filter.categoryId } : {}),
      ...(filter.collectionId ? { collectionId: filter.collectionId } : {}),
      ...(filter.isFeatured !== undefined ? { isFeatured: filter.isFeatured } : {}),
    };

    const [records, total] = await Promise.all([
      this.prisma.creation.findMany({
        where,
        select: CREATION_DETAIL_SELECT,
        orderBy: buildOrderBy(filter.sort),
        skip: (filter.page - 1) * filter.limit,
        take: filter.limit,
      }),
      this.prisma.creation.count({ where }),
    ]);

    return { items: records.map((record) => CreationMapper.toDomain(record)), total };
  }
}
