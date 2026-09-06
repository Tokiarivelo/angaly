import type { CreationRecord} from '../../infrastructure/repositories/prisma-creation.repository';
import { PrismaCreationRepository } from '../../infrastructure/repositories/prisma-creation.repository';
import type { PrismaService } from '../../../prisma/prisma.service';

interface MockCreationDelegate {
  findUnique: jest.Mock;
  findMany: jest.Mock;
  count: jest.Mock;
}

function buildPrismaServiceMock(): { prisma: PrismaService; creation: MockCreationDelegate } {
  const creation: MockCreationDelegate = {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
  };
  const prisma = { creation } as unknown as PrismaService;
  return { prisma, creation };
}

function sampleRecord(): CreationRecord {
  return {
    id: 'creation-1',
    slug: 'robe-eternelle',
    name: 'Robe Éternelle',
    description: 'Une robe intemporelle.',
    materials: null,
    techniques: null,
    availability: 'PIECE_UNIQUE',
    reproducible: true,
    isFeatured: false,
    featuredFrom: null,
    featuredUntil: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    category: { id: 'cat-1', slug: 'robes', name: 'Robes' },
    collection: null,
    media: [],
  };
}

describe('PrismaCreationRepository', () => {
  it('findBySlug() returns null when no row matches', async () => {
    const { prisma, creation } = buildPrismaServiceMock();
    creation.findUnique.mockResolvedValue(null);
    const repository = new PrismaCreationRepository(prisma);

    expect(await repository.findBySlug('missing')).toBeNull();
  });

  it('findBySlug() maps the row to a domain entity when found', async () => {
    const { prisma, creation } = buildPrismaServiceMock();
    creation.findUnique.mockResolvedValue(sampleRecord());
    const repository = new PrismaCreationRepository(prisma);

    const result = await repository.findBySlug('robe-eternelle');

    expect(result?.slug).toBe('robe-eternelle');
  });

  it('list() applies category/collection/featured filters and default sort (newest)', async () => {
    const { prisma, creation } = buildPrismaServiceMock();
    creation.findMany.mockResolvedValue([sampleRecord()]);
    creation.count.mockResolvedValue(1);
    const repository = new PrismaCreationRepository(prisma);

    const result = await repository.list({
      categoryId: 'cat-1',
      collectionId: 'coll-1',
      isFeatured: true,
      page: 2,
      limit: 10,
    });

    expect(creation.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { categoryId: 'cat-1', collectionId: 'coll-1', isFeatured: true },
        orderBy: [{ createdAt: 'desc' }],
        skip: 10,
        take: 10,
      }),
    );
    expect(result.total).toBe(1);
    expect(result.items).toHaveLength(1);
  });

  it('list() sorts by isFeatured first when sort=featured', async () => {
    const { prisma, creation } = buildPrismaServiceMock();
    creation.findMany.mockResolvedValue([]);
    creation.count.mockResolvedValue(0);
    const repository = new PrismaCreationRepository(prisma);

    await repository.list({ sort: 'featured', page: 1, limit: 20 });

    expect(creation.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ orderBy: [{ isFeatured: 'desc' }, { createdAt: 'desc' }] }),
    );
  });

  it('list() sorts by featuredFrom when sort=featuredFrom', async () => {
    const { prisma, creation } = buildPrismaServiceMock();
    creation.findMany.mockResolvedValue([]);
    creation.count.mockResolvedValue(0);
    const repository = new PrismaCreationRepository(prisma);

    await repository.list({ sort: 'featuredFrom', page: 1, limit: 20 });

    expect(creation.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ orderBy: [{ featuredFrom: 'desc' }, { createdAt: 'desc' }] }),
    );
  });

  it('list() applies no filter when none is given', async () => {
    const { prisma, creation } = buildPrismaServiceMock();
    creation.findMany.mockResolvedValue([]);
    creation.count.mockResolvedValue(0);
    const repository = new PrismaCreationRepository(prisma);

    await repository.list({ page: 1, limit: 20 });

    expect(creation.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: {} }));
  });
});
