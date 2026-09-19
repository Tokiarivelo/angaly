import { BadRequestException } from '@nestjs/common';
import { Prisma } from '@angaly/database';

import { PrismaMediaRepository } from '../../infrastructure/repositories/prisma-media.repository';
import { MediaEntity } from '../../domain/entities/media.entity';
import { MediaEntityRef } from '../../domain/value-objects/media-entity-ref.vo';
import type { PrismaService } from '../../../prisma/prisma.service';

interface MockMediaDelegate {
  create: jest.Mock;
  findUnique: jest.Mock;
  findMany: jest.Mock;
  count: jest.Mock;
  update: jest.Mock;
  delete: jest.Mock;
}

function buildPrismaServiceMock(): { prisma: PrismaService; media: MockMediaDelegate } {
  const media: MockMediaDelegate = {
    create: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };
  const prisma = { media } as unknown as PrismaService;
  return { prisma, media };
}

function sampleEntity(entityRef: MediaEntityRef = MediaEntityRef.create('CREATION', 'creation-1')): MediaEntity {
  return MediaEntity.create({
    id: 'media-1',
    bucket: 'creations',
    objectKey: 'abc.jpg',
    url: 'http://localhost:9000/creations/abc.jpg',
    altText: 'Robe éternelle',
    mimeType: 'image/jpeg',
    sizeBytes: 100,
    width: null,
    height: null,
    entityRef,
    sortOrder: 0,
    uploadedById: null,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
  });
}

function samplePrismaRecord() {
  return {
    id: 'media-1',
    bucket: 'creations',
    objectKey: 'abc.jpg',
    url: 'http://localhost:9000/creations/abc.jpg',
    altText: 'Robe éternelle',
    mimeType: 'image/jpeg',
    sizeBytes: 100,
    width: null,
    height: null,
    entityType: 'CREATION',
    entityId: 'creation-1',
    sortOrder: 0,
    uploadedById: null,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
  };
}

describe('PrismaMediaRepository', () => {
  it('create() persists the entity via prisma.media.create and remaps the row', async () => {
    const { prisma, media } = buildPrismaServiceMock();
    media.create.mockResolvedValue(samplePrismaRecord());
    const repository = new PrismaMediaRepository(prisma);

    const result = await repository.create(sampleEntity());

    const call = media.create.mock.calls[0] as [{ data: { id: string; bucket: string; altText: string } }];
    expect(call[0].data).toMatchObject({ id: 'media-1', bucket: 'creations', altText: 'Robe éternelle' });
    expect(result.id).toBe('media-1');
  });

  it.each([
    ['CREATION', 'creationRefs'],
    ['PRODUCT', 'productRefs'],
    ['PRODUCT_VARIANT', 'productVariantRefs'],
    ['COLLECTION', 'collectionRefs'],
    ['ATELIER', 'atelierRefs'],
    ['BLOG_POST', 'blogPostRefs'],
  ] as const)('create() connects %s to the %s relation when an entityId is given', async (entityType, relationField) => {
    const { prisma, media } = buildPrismaServiceMock();
    media.create.mockResolvedValue(samplePrismaRecord());
    const repository = new PrismaMediaRepository(prisma);

    await repository.create(sampleEntity(MediaEntityRef.create(entityType, 'target-1')));

    const call = media.create.mock.calls[0] as [{ data: Record<string, unknown> }];
    expect(call[0].data[relationField]).toEqual({ connect: [{ id: 'target-1' }] });
  });

  it.each(['PAGE_SECTION', 'PATTERN_EXPORT', 'CUSTOMER_AVATAR', 'QUOTE_DOCUMENT'] as const)(
    'create() never connects a relation for %s — its media reference is owned by the other model',
    async (entityType) => {
      const { prisma, media } = buildPrismaServiceMock();
      media.create.mockResolvedValue(samplePrismaRecord());
      const repository = new PrismaMediaRepository(prisma);

      await repository.create(sampleEntity(MediaEntityRef.create(entityType, 'target-1')));

      const call = media.create.mock.calls[0] as [{ data: Record<string, unknown> }];
      expect(call[0].data).not.toHaveProperty('creationRefs');
      expect(call[0].data).not.toHaveProperty('productRefs');
      expect(call[0].data).not.toHaveProperty('productVariantRefs');
      expect(call[0].data).not.toHaveProperty('collectionRefs');
      expect(call[0].data).not.toHaveProperty('atelierRefs');
      expect(call[0].data).not.toHaveProperty('blogPostRefs');
    },
  );

  it('create() never connects a relation when entityId is null, even for a connectable entityType', async () => {
    const { prisma, media } = buildPrismaServiceMock();
    media.create.mockResolvedValue(samplePrismaRecord());
    const repository = new PrismaMediaRepository(prisma);

    await repository.create(sampleEntity(MediaEntityRef.create('CREATION', null)));

    const call = media.create.mock.calls[0] as [{ data: Record<string, unknown> }];
    expect(call[0].data).not.toHaveProperty('creationRefs');
  });

  it('create() maps a Prisma "record to connect not found" error (P2025) to a BadRequestException', async () => {
    const { prisma, media } = buildPrismaServiceMock();
    media.create.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('An operation failed because it depends on one or more records that were required but not found.', {
        code: 'P2025',
        clientVersion: '6.19.3',
      }),
    );
    const repository = new PrismaMediaRepository(prisma);

    await expect(repository.create(sampleEntity())).rejects.toThrow(BadRequestException);
  });

  it('create() rethrows any other error unchanged', async () => {
    const { prisma, media } = buildPrismaServiceMock();
    media.create.mockRejectedValue(new Error('connection lost'));
    const repository = new PrismaMediaRepository(prisma);

    await expect(repository.create(sampleEntity())).rejects.toThrow('connection lost');
  });

  it('findById() returns null when no row matches', async () => {
    const { prisma, media } = buildPrismaServiceMock();
    media.findUnique.mockResolvedValue(null);
    const repository = new PrismaMediaRepository(prisma);

    expect(await repository.findById('missing')).toBeNull();
  });

  it('findById() maps the row to a domain entity when found', async () => {
    const { prisma, media } = buildPrismaServiceMock();
    media.findUnique.mockResolvedValue(samplePrismaRecord());
    const repository = new PrismaMediaRepository(prisma);

    const result = await repository.findById('media-1');

    expect(result?.id).toBe('media-1');
  });

  it('list() applies the bucket filter, pagination, and returns the total count', async () => {
    const { prisma, media } = buildPrismaServiceMock();
    media.findMany.mockResolvedValue([samplePrismaRecord()]);
    media.count.mockResolvedValue(1);
    const repository = new PrismaMediaRepository(prisma);

    const result = await repository.list({ bucket: 'creations', page: 2, limit: 10 });

    expect(media.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { bucket: 'creations' }, skip: 10, take: 10 }),
    );
    expect(result.total).toBe(1);
    expect(result.items).toHaveLength(1);
  });

  it('list() applies the entityType and entityId filters', async () => {
    const { prisma, media } = buildPrismaServiceMock();
    media.findMany.mockResolvedValue([]);
    media.count.mockResolvedValue(0);
    const repository = new PrismaMediaRepository(prisma);

    await repository.list({ entityType: 'CREATION', entityId: 'creation-1', page: 1, limit: 20 });

    expect(media.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { entityType: 'CREATION', entityId: 'creation-1' } }),
    );
  });

  it('list() applies no filter when none is given', async () => {
    const { prisma, media } = buildPrismaServiceMock();
    media.findMany.mockResolvedValue([]);
    media.count.mockResolvedValue(0);
    const repository = new PrismaMediaRepository(prisma);

    await repository.list({ page: 1, limit: 20 });

    expect(media.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: {} }));
  });

  it('delete() forwards to prisma.media.delete', async () => {
    const { prisma, media } = buildPrismaServiceMock();
    const repository = new PrismaMediaRepository(prisma);

    await repository.delete('media-1');

    expect(media.delete).toHaveBeenCalledWith({ where: { id: 'media-1' } });
  });

  it('countActiveReferences() sums every polymorphic relation count', async () => {
    const { prisma, media } = buildPrismaServiceMock();
    media.findUnique.mockResolvedValue({
      _count: {
        creationRefs: 1,
        productRefs: 0,
        productVariantRefs: 1,
        collectionRefs: 2,
        atelierRefs: 0,
        blogPostRefs: 0,
        testimonialRefs: 0,
        patternInspirationOf: 0,
        patternExportOf: 0,
        pageSectionRefs: 0,
      },
    });
    const repository = new PrismaMediaRepository(prisma);

    expect(await repository.countActiveReferences('media-1')).toBe(4);
  });

  it('countActiveReferences() returns 0 when the media does not exist', async () => {
    const { prisma, media } = buildPrismaServiceMock();
    media.findUnique.mockResolvedValue(null);
    const repository = new PrismaMediaRepository(prisma);

    expect(await repository.countActiveReferences('missing')).toBe(0);
  });

  it('list() applies the search filter across objectKey/altText', async () => {
    const { prisma, media } = buildPrismaServiceMock();
    media.findMany.mockResolvedValue([]);
    media.count.mockResolvedValue(0);
    const repository = new PrismaMediaRepository(prisma);

    await repository.list({ search: 'robe', page: 1, limit: 20 });

    expect(media.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          OR: [
            { objectKey: { contains: 'robe', mode: 'insensitive' } },
            { altText: { contains: 'robe', mode: 'insensitive' } },
          ],
        },
      }),
    );
  });

  it.each([
    ['recent', [{ createdAt: 'desc' }]],
    ['name', [{ objectKey: 'asc' }]],
    ['size', [{ sizeBytes: 'desc' }]],
    [undefined, [{ createdAt: 'desc' }]],
  ] as const)('list() orders by %s', async (sortBy, expectedOrderBy) => {
    const { prisma, media } = buildPrismaServiceMock();
    media.findMany.mockResolvedValue([]);
    media.count.mockResolvedValue(0);
    const repository = new PrismaMediaRepository(prisma);

    await repository.list({ sortBy, page: 1, limit: 20 });

    expect(media.findMany).toHaveBeenCalledWith(expect.objectContaining({ orderBy: expectedOrderBy }));
  });

  it('update() forwards the patch to prisma.media.update and remaps the row', async () => {
    const { prisma, media } = buildPrismaServiceMock();
    media.update.mockResolvedValue(samplePrismaRecord());
    const repository = new PrismaMediaRepository(prisma);

    const result = await repository.update('media-1', { altText: 'Nouveau texte' });

    expect(media.update).toHaveBeenCalledWith({ where: { id: 'media-1' }, data: { altText: 'Nouveau texte' } });
    expect(result.id).toBe('media-1');
  });

  it('findUsages() returns an empty array when the media does not exist', async () => {
    const { prisma, media } = buildPrismaServiceMock();
    media.findUnique.mockResolvedValue(null);
    const repository = new PrismaMediaRepository(prisma);

    expect(await repository.findUsages('missing')).toEqual([]);
  });

  it('findUsages() maps every polymorphic relation to a labeled usage ref', async () => {
    const { prisma, media } = buildPrismaServiceMock();
    media.findUnique.mockResolvedValue({
      creationRefs: [{ id: 'creation-1', name: 'Robe Éternelle' }],
      productRefs: [{ id: 'product-1', name: 'Chemise Lin' }],
      productVariantRefs: [{ id: 'variant-1', sku: 'CHM-LIN-NAVY-M' }],
      collectionRefs: [{ id: 'collection-1', name: 'Collection Été' }],
      atelierRefs: [{ id: 'atelier-1', name: 'Atelier Tana' }],
      blogPostRefs: [{ id: 'post-1', title: 'Article de blog' }],
      testimonialRefs: [{ id: 'testimonial-1', customerName: 'Jeanne D.' }],
      patternInspirationOf: [{ id: 'project-1', projectRef: 'ANG-PAT-2026-00001' }],
      patternExportOf: [{ id: 'export-1', format: 'PDF' }],
      pageSectionRefs: [{ id: 'section-1', page: 'accueil', sectionKey: 'hero' }],
    });
    const repository = new PrismaMediaRepository(prisma);

    const result = await repository.findUsages('media-1');

    expect(result).toEqual([
      { entityType: 'CREATION', entityId: 'creation-1', label: 'Robe Éternelle' },
      { entityType: 'PRODUCT', entityId: 'product-1', label: 'Chemise Lin' },
      { entityType: 'PRODUCT_VARIANT', entityId: 'variant-1', label: 'CHM-LIN-NAVY-M' },
      { entityType: 'COLLECTION', entityId: 'collection-1', label: 'Collection Été' },
      { entityType: 'ATELIER', entityId: 'atelier-1', label: 'Atelier Tana' },
      { entityType: 'BLOG_POST', entityId: 'post-1', label: 'Article de blog' },
      { entityType: 'TESTIMONIAL', entityId: 'testimonial-1', label: 'Jeanne D.' },
      { entityType: 'PATTERN_PROJECT', entityId: 'project-1', label: 'ANG-PAT-2026-00001' },
      { entityType: 'PATTERN_EXPORT', entityId: 'export-1', label: 'Export PDF' },
      { entityType: 'PAGE_SECTION', entityId: 'section-1', label: 'accueil — hero' },
    ]);
  });
});
