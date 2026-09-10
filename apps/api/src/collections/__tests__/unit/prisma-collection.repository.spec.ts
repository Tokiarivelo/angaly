import type {
  CollectionDetailRecord,
  CollectionSummaryRecord} from '../../infrastructure/repositories/prisma-collection.repository';
import {
  PrismaCollectionRepository,
} from '../../infrastructure/repositories/prisma-collection.repository';
import type { PrismaService } from '../../../prisma/prisma.service';

interface MockCollectionDelegate {
  findFirst: jest.Mock;
  findUnique: jest.Mock;
  findMany: jest.Mock;
  count: jest.Mock;
}

function buildPrismaServiceMock(): { prisma: PrismaService; collection: MockCollectionDelegate } {
  const collection: MockCollectionDelegate = {
    findFirst: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
  };
  const prisma = { collection } as unknown as PrismaService;
  return { prisma, collection };
}

function sampleSummary(): CollectionSummaryRecord {
  return {
    id: 'collection-1',
    slug: 'eternelle',
    name: 'Éternelle',
    description: null,
    story: null,
    seasonYear: 2026,
    publishedAt: new Date('2020-01-01T00:00:00.000Z'),
    createdAt: new Date(),
    updatedAt: new Date(),
    media: [],
    _count: { creations: 0 },
  };
}

function sampleDetail(): CollectionDetailRecord {
  return { ...sampleSummary(), creations: [] };
}

describe('PrismaCollectionRepository', () => {
  it('findById() returns null when no row matches', async () => {
    const { prisma, collection } = buildPrismaServiceMock();
    collection.findUnique.mockResolvedValue(null);
    const repository = new PrismaCollectionRepository(prisma);

    expect(await repository.findById('missing')).toBeNull();
  });

  it('findById() maps the row to a domain entity regardless of publication status', async () => {
    const { prisma, collection } = buildPrismaServiceMock();
    collection.findUnique.mockResolvedValue(sampleDetail());
    const repository = new PrismaCollectionRepository(prisma);

    const result = await repository.findById('collection-1');

    expect(result?.id).toBe('collection-1');
    expect(collection.findUnique).toHaveBeenCalledWith(expect.objectContaining({ where: { id: 'collection-1' } }));
  });

  it('findPublishedBySlug() returns null when no published row matches', async () => {
    const { prisma, collection } = buildPrismaServiceMock();
    collection.findFirst.mockResolvedValue(null);
    const repository = new PrismaCollectionRepository(prisma);

    expect(await repository.findPublishedBySlug('missing')).toBeNull();
  });

  it('findPublishedBySlug() scopes the query to slug + published (not null, in the past)', async () => {
    const { prisma, collection } = buildPrismaServiceMock();
    collection.findFirst.mockResolvedValue(sampleDetail());
    const repository = new PrismaCollectionRepository(prisma);

    const result = await repository.findPublishedBySlug('eternelle');

    const call = collection.findFirst.mock.calls[0] as [
      { where: { slug: string; publishedAt: { not: null; lte: Date } } },
    ];
    expect(call[0].where.slug).toBe('eternelle');
    expect(call[0].where.publishedAt.not).toBeNull();
    expect(call[0].where.publishedAt.lte).toBeInstanceOf(Date);
    expect(result?.slug).toBe('eternelle');
  });

  it('list() defaults to sorting by publishedAt desc and excludes unpublished rows', async () => {
    const { prisma, collection } = buildPrismaServiceMock();
    collection.findMany.mockResolvedValue([sampleSummary()]);
    collection.count.mockResolvedValue(1);
    const repository = new PrismaCollectionRepository(prisma);

    const result = await repository.list({ page: 1, limit: 20 });

    const call = collection.findMany.mock.calls[0] as [
      { where: { publishedAt: { not: null; lte: Date } }; orderBy: unknown },
    ];
    expect(call[0].where.publishedAt.not).toBeNull();
    expect(call[0].where.publishedAt.lte).toBeInstanceOf(Date);
    expect(call[0].orderBy).toEqual([{ publishedAt: 'desc' }]);
    expect(result.total).toBe(1);
    expect(result.items[0]?.creations).toBeNull();
  });

  it('list() applies the seasonYear filter and a custom sort', async () => {
    const { prisma, collection } = buildPrismaServiceMock();
    collection.findMany.mockResolvedValue([]);
    collection.count.mockResolvedValue(0);
    const repository = new PrismaCollectionRepository(prisma);

    await repository.list({ seasonYear: 2026, sort: 'seasonYear:asc', page: 2, limit: 10 });

    const call = collection.findMany.mock.calls[0] as [
      { where: { seasonYear: number }; orderBy: unknown; skip: number; take: number },
    ];
    expect(call[0].where.seasonYear).toBe(2026);
    expect(call[0].orderBy).toEqual([{ seasonYear: 'asc' }]);
    expect(call[0].skip).toBe(10);
    expect(call[0].take).toBe(10);
  });
});
