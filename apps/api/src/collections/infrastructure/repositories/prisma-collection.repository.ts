import { Injectable } from '@nestjs/common';
import { Prisma } from '@angaly/database';

import { PrismaService } from '../../../prisma/prisma.service';
import { CollectionEntity } from '../../domain/entities/collection.entity';
import {
  CollectionListFilter,
  CollectionListResult,
  ICollectionRepository,
} from '../../domain/repositories/collection.repository';
import { CollectionMapper } from '../mappers/collection.mapper';

export const COLLECTION_SUMMARY_SELECT = {
  id: true,
  slug: true,
  name: true,
  description: true,
  story: true,
  seasonYear: true,
  publishedAt: true,
  createdAt: true,
  updatedAt: true,
  media: {
    orderBy: { sortOrder: 'asc' },
    select: { id: true, url: true, altText: true, sortOrder: true },
  },
  _count: { select: { creations: true } },
} satisfies Prisma.CollectionSelect;

export type CollectionSummaryRecord = Prisma.CollectionGetPayload<{
  select: typeof COLLECTION_SUMMARY_SELECT;
}>;

export const COLLECTION_DETAIL_SELECT = {
  ...COLLECTION_SUMMARY_SELECT,
  creations: {
    select: {
      id: true,
      slug: true,
      name: true,
      media: { orderBy: { sortOrder: 'asc' }, take: 1, select: { url: true } },
    },
  },
} satisfies Prisma.CollectionSelect;

export type CollectionDetailRecord = Prisma.CollectionGetPayload<{
  select: typeof COLLECTION_DETAIL_SELECT;
}>;

function publishedWhere(): Prisma.CollectionWhereInput {
  return { publishedAt: { not: null, lte: new Date() } };
}

@Injectable()
export class PrismaCollectionRepository implements ICollectionRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findPublishedBySlug(slug: string): Promise<CollectionEntity | null> {
    const record = await this.prisma.collection.findFirst({
      where: { slug, ...publishedWhere() },
      select: COLLECTION_DETAIL_SELECT,
    });
    return record ? CollectionMapper.toDomainDetail(record) : null;
  }

  async list(filter: CollectionListFilter): Promise<CollectionListResult> {
    const where: Prisma.CollectionWhereInput = {
      ...publishedWhere(),
      ...(filter.seasonYear !== undefined ? { seasonYear: filter.seasonYear } : {}),
    };
    const [field, direction] = (filter.sort ?? 'publishedAt:desc').split(':') as [
      'seasonYear' | 'publishedAt',
      'asc' | 'desc',
    ];

    const [records, total] = await Promise.all([
      this.prisma.collection.findMany({
        where,
        select: COLLECTION_SUMMARY_SELECT,
        orderBy: [{ [field]: direction }],
        skip: (filter.page - 1) * filter.limit,
        take: filter.limit,
      }),
      this.prisma.collection.count({ where }),
    ]);

    return { items: records.map((record) => CollectionMapper.toDomainSummary(record)), total };
  }
}
