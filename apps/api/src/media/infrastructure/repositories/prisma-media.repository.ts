import { BadRequestException, Injectable } from '@nestjs/common';
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
      productVariantRefs: true,
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
  productVariantRefs: { select: { id: true, sku: true } },
  collectionRefs: { select: { id: true, name: true } },
  atelierRefs: { select: { id: true, name: true } },
  blogPostRefs: { select: { id: true, title: true } },
  testimonialRefs: { select: { id: true, customerName: true } },
  patternInspirationOf: { select: { id: true, projectRef: true } },
  patternExportOf: { select: { id: true, format: true } },
  pageSectionRefs: { select: { id: true, page: true, sectionKey: true } },
} satisfies Prisma.MediaSelect;

/**
 * Only these `MediaEntityType`s map to a true Media-side many-to-many
 * relation (`Media[]` declared on both models, connectable from either
 * side) — see docs/features/media.md "Points d'attention" for the full
 * reasoning. The other 4 values (`CUSTOMER_AVATAR`, `PATTERN_EXPORT`,
 * `PAGE_SECTION`, `QUOTE_DOCUMENT`) are either unmodeled or owned by a
 * single FK on the *other* model, set by that model's own use-case
 * (`PageSection.mediaId`, `PatternExport.mediaId`) — never by `media`
 * itself, so they're deliberately excluded here.
 */
const ENTITY_TYPE_TO_RELATION: Partial<Record<string, keyof Prisma.MediaCreateInput>> = {
  CREATION: 'creationRefs',
  PRODUCT: 'productRefs',
  PRODUCT_VARIANT: 'productVariantRefs',
  COLLECTION: 'collectionRefs',
  ATELIER: 'atelierRefs',
  BLOG_POST: 'blogPostRefs',
};

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
    const { entityType, entityId } = media.entityRef;
    const relationField = entityId ? ENTITY_TYPE_TO_RELATION[entityType] : undefined;

    try {
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
          // Connects the actual polymorphic relation (creationRefs, productRefs, ...) in
          // addition to the denormalized entityType/entityId above — without this, "used in"
          // (findUsages/countActiveReferences) never sees a media uploaded through the normal
          // flow, only seed data that connects it by hand. See docs/features/media.md.
          ...(relationField ? { [relationField]: { connect: [{ id: entityId }] } } : {}),
        },
      });
      return MediaMapper.toDomain(record);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        throw new BadRequestException(`${entityType} "${entityId}" does not exist — cannot attach this media to it`);
      }
      throw error;
    }
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
    for (const variant of record.productVariantRefs) {
      usages.push({ entityType: 'PRODUCT_VARIANT', entityId: variant.id, label: variant.sku });
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
