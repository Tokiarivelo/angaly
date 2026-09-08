import type { CategoryRecord } from '../../infrastructure/repositories/prisma-category.repository';
import { PrismaCategoryRepository } from '../../infrastructure/repositories/prisma-category.repository';
import type { PrismaService } from '../../../prisma/prisma.service';

interface MockCategoryDelegate {
  findMany: jest.Mock;
}

function buildPrismaServiceMock(): { prisma: PrismaService; category: MockCategoryDelegate } {
  const category: MockCategoryDelegate = { findMany: jest.fn() };
  const prisma = { category } as unknown as PrismaService;
  return { prisma, category };
}

function sampleRecord(): CategoryRecord {
  return { id: 'cat-1', slug: 'robes-de-mariee', name: 'Robes de mariée', kind: 'CREATION' };
}

describe('PrismaCategoryRepository', () => {
  it('list() with no kind queries without a where clause, sorted by name', async () => {
    const { prisma, category } = buildPrismaServiceMock();
    category.findMany.mockResolvedValue([sampleRecord()]);
    const repository = new PrismaCategoryRepository(prisma);

    const result = await repository.list();

    const call = category.findMany.mock.calls[0] as [{ where: unknown; orderBy: unknown }];
    expect(call[0].where).toBeUndefined();
    expect(call[0].orderBy).toEqual({ name: 'asc' });
    expect(result).toHaveLength(1);
  });

  it('list(kind) filters by the given kind', async () => {
    const { prisma, category } = buildPrismaServiceMock();
    category.findMany.mockResolvedValue([]);
    const repository = new PrismaCategoryRepository(prisma);

    await repository.list('CREATION');

    const call = category.findMany.mock.calls[0] as [{ where: unknown }];
    expect(call[0].where).toEqual({ kind: 'CREATION' });
  });
});
