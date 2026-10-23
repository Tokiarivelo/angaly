import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../prisma/prisma.service';
import { CATALOG_IMAGE_PREFIX, type CatalogImage, type ICatalogImageRepository } from '../domain/catalog-entry';

/**
 * The catalogue's inspiration photos: Media rows (entity PATTERN_INSPIRATION, no owner) whose altText starts with
 * `catalog:<id>` — uploaded by `apps/ai-service/ml/scripts/seed_pattern_catalog.py` through the media endpoints, so the
 * files live in MinIO like every other media (@angaly/storage).
 */
@Injectable()
export class PrismaCatalogImageRepository implements ICatalogImageRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<Map<string, CatalogImage>> {
    const rows = await this.prisma.media.findMany({
      where: { entityType: 'PATTERN_INSPIRATION', altText: { startsWith: CATALOG_IMAGE_PREFIX } },
      orderBy: { createdAt: 'desc' },
    });
    const out = new Map<string, CatalogImage>();
    for (const row of rows) {
      const id = (row.altText ?? '').slice(CATALOG_IMAGE_PREFIX.length).split(/\s/)[0];
      // The most recent upload wins (rows are sorted newest first).
      if (!id || out.has(id)) continue;
      out.set(id, { mediaId: row.id, bucket: row.bucket, objectKey: row.objectKey, url: row.url, mimeType: row.mimeType, sizeBytes: row.sizeBytes });
    }
    return out;
  }
}
