import { Injectable } from '@nestjs/common';
import { Prisma } from '@angaly/database';

import { PrismaService } from '../../../prisma/prisma.service';
import { MediaEntity } from '../../domain/entities/media.entity';
import {
  IMediaRepository,
  MediaListFilter,
  MediaListResult,
  MediaUpdateInput,
  MediaUsageRef,
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

/** One label field per relation, used only to build a human-readable "Utilisée dans" entry — see docs/pages/admin-mediatheque.md. */
const USAGE_SELECT = {
  creationRefs: { select: { id: true, name: true } },
  productRefs: { select: { id: true, name: true } },
  collectionRefs: { select: { id: true, name: true } },
  atelierRefs: { select: { id: true, name: true } },
  blogPostRefs: { select: { id: true, title: true } },
  testimonialRefs: { select: { id: true, customerName: true } },
  patternInspirationOf: { select: { id: true, projectRef: true } },
  patternExportOf: { select: { id: true, format: true } },
  pageSectionRefs: { select: { id: true, page: true, sectionKey: true } },
} satisfies Prisma.MediaSelect;

function buildOrderBy(sortBy: MediaListFilter['sortBy']): Prisma.MediaOrderByWithRelationInput[] {
  switch (sortBy) {
    case 'name':
      return [{ objectKey: 'asc' }];
    case 'size':
      return [{ sizeBytes: 'desc' }];
    case 'recent':
    default:
      return [{ createdAt: 'desc' }];
  }
}

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
      ...(filter.search
        ? {
            OR: [
              { objectKey: { contains: filter.search, mode: 'insensitive' } },
              { altText: { contains: filter.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [records, total] = await Promise.all([
      this.prisma.media.findMany({
        where,
        orderBy: buildOrderBy(filter.sortBy),
        skip: (filter.page - 1) * filter.limit,
        take: filter.limit,
      }),
      this.prisma.media.count({ where }),
    ]);

    return { items: records.map((record) => MediaMapper.toDomain(record)), total };
  }

  async update(id: string, patch: MediaUpdateInput): Promise<MediaEntity> {
    const record = await this.prisma.media.update({ where: { id }, data: patch });
    return MediaMapper.toDomain(record);
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

  async findUsages(id: string): Promise<MediaUsageRef[]> {
    const record = await this.prisma.media.findUnique({ where: { id }, select: USAGE_SELECT });
    if (!record) {
      return [];
    }

    const usages: MediaUsageRef[] = [];
    for (const creation of record.creationRefs) {
      usages.push({ entityType: 'CREATION', entityId: creation.id, label: creation.name });
    }
    for (const product of record.productRefs) {
      usages.push({ entityType: 'PRODUCT', entityId: product.id, label: product.name });
    }
    for (const collection of record.collectionRefs) {
      usages.push({ entityType: 'COLLECTION', entityId: collection.id, label: collection.name });
    }
    for (const atelier of record.atelierRefs) {
      usages.push({ entityType: 'ATELIER', entityId: atelier.id, label: atelier.name });
    }
    for (const blogPost of record.blogPostRefs) {
      usages.push({ entityType: 'BLOG_POST', entityId: blogPost.id, label: blogPost.title });
    }
    for (const testimonial of record.testimonialRefs) {
      usages.push({ entityType: 'TESTIMONIAL', entityId: testimonial.id, label: testimonial.customerName });
    }
    for (const patternProject of record.patternInspirationOf) {
      usages.push({ entityType: 'PATTERN_PROJECT', entityId: patternProject.id, label: patternProject.projectRef });
    }
    for (const patternExport of record.patternExportOf) {
      usages.push({
        entityType: 'PATTERN_EXPORT',
        entityId: patternExport.id,
        label: `Export ${patternExport.format}`,
      });
    }
    for (const pageSection of record.pageSectionRefs) {
      usages.push({
        entityType: 'PAGE_SECTION',
        entityId: pageSection.id,
        label: `${pageSection.page} — ${pageSection.sectionKey}`,
      });
    }

    return usages;
  }
}
