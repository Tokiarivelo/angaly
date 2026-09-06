import { Injectable } from '@nestjs/common';
import { Prisma } from '@angaly/database';

import { PrismaService } from '../../../prisma/prisma.service';
import { MediaEntity } from '../../domain/entities/media.entity';
import {
  IMediaRepository,
  MediaListFilter,
  MediaListResult,
} from '../../domain/repositories/media.repository';
import { MediaMapper } from '../mappers/media.mapper';

const REFERENCE_COUNT_SELECT = {
  _count: {
    select: {
      creationRefs: true,
      productRefs: true,
      collectionRefs: true,
      atelierRefs: true,
      blogPostRefs: true,
      testimonialRefs: true,
      patternInspirationOf: true,
      patternExportOf: true,
      pageSectionRefs: true,
    },
  },
} satisfies Prisma.MediaSelect;

@Injectable()
export class PrismaMediaRepository implements IMediaRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(media: MediaEntity): Promise<MediaEntity> {
    const record = await this.prisma.media.create({
      data: {
        id: media.id,
        bucket: media.bucket,
        objectKey: media.objectKey,
        url: media.url,
        altText: media.altText,
        mimeType: media.mimeType,
        sizeBytes: media.sizeBytes,
        width: media.width,
        height: media.height,
        entityType: media.entityRef.entityType,
        entityId: media.entityRef.entityId,
        sortOrder: media.sortOrder,
        uploadedById: media.uploadedById,
      },
    });
    return MediaMapper.toDomain(record);
  }

  async findById(id: string): Promise<MediaEntity | null> {
    const record = await this.prisma.media.findUnique({ where: { id } });
    return record ? MediaMapper.toDomain(record) : null;
  }

  async list(filter: MediaListFilter): Promise<MediaListResult> {
    const where: Prisma.MediaWhereInput = {
      ...(filter.bucket ? { bucket: filter.bucket } : {}),
      ...(filter.entityType ? { entityType: filter.entityType } : {}),
      ...(filter.entityId ? { entityId: filter.entityId } : {}),
    };

    const [records, total] = await Promise.all([
      this.prisma.media.findMany({
        where,
        orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
        skip: (filter.page - 1) * filter.limit,
        take: filter.limit,
      }),
      this.prisma.media.count({ where }),
    ]);

    return { items: records.map((record) => MediaMapper.toDomain(record)), total };
  }

  async delete(id: string): Promise<void> {
    await this.prisma.media.delete({ where: { id } });
  }

  async countActiveReferences(id: string): Promise<number> {
    const record = await this.prisma.media.findUnique({
      where: { id },
      select: REFERENCE_COUNT_SELECT,
    });
    if (!record) {
      return 0;
    }
    return Object.values(record._count).reduce((sum, count) => sum + count, 0);
  }
}
