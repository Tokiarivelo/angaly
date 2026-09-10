import type { FavoriteRecord } from '../../infrastructure/repositories/prisma-favorite.repository';
import { PrismaFavoriteRepository } from '../../infrastructure/repositories/prisma-favorite.repository';
import type { PrismaService } from '../../../prisma/prisma.service';

interface MockFavoriteDelegate {
  findUnique: jest.Mock;
  create: jest.Mock;
  delete: jest.Mock;
  findMany: jest.Mock;
}

function buildPrismaServiceMock(): { prisma: PrismaService; favorite: MockFavoriteDelegate } {
  const favorite: MockFavoriteDelegate = {
    findUnique: jest.fn(),
    create: jest.fn(),
    delete: jest.fn(),
    findMany: jest.fn(),
  };
  const prisma = { favorite } as unknown as PrismaService;
  return { prisma, favorite };
}

function sampleRecord(): FavoriteRecord {
  return { id: 'favorite-1', customerId: 'customer-1', entityType: 'CREATION', entityId: 'creation-1', createdAt: new Date() };
}

describe('PrismaFavoriteRepository', () => {
  it('findById() returns null when no row matches', async () => {
    const { prisma, favorite } = buildPrismaServiceMock();
    favorite.findUnique.mockResolvedValue(null);
    const repository = new PrismaFavoriteRepository(prisma);

    expect(await repository.findById('missing')).toBeNull();
  });

  it('findByCustomerAndEntity() queries the compound unique key', async () => {
    const { prisma, favorite } = buildPrismaServiceMock();
    favorite.findUnique.mockResolvedValue(sampleRecord());
    const repository = new PrismaFavoriteRepository(prisma);

    const result = await repository.findByCustomerAndEntity('customer-1', 'CREATION', 'creation-1');

    expect(favorite.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { customerId_entityType_entityId: { customerId: 'customer-1', entityType: 'CREATION', entityId: 'creation-1' } },
      }),
    );
    expect(result?.id).toBe('favorite-1');
  });

  it('create() persists a new favorite row', async () => {
    const { prisma, favorite } = buildPrismaServiceMock();
    favorite.create.mockResolvedValue(sampleRecord());
    const repository = new PrismaFavoriteRepository(prisma);

    const result = await repository.create('customer-1', 'CREATION', 'creation-1');

    expect(favorite.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: { customerId: 'customer-1', entityType: 'CREATION', entityId: 'creation-1' } }),
    );
    expect(result.id).toBe('favorite-1');
  });

  it('delete() removes the row by id', async () => {
    const { prisma, favorite } = buildPrismaServiceMock();
    const repository = new PrismaFavoriteRepository(prisma);

    await repository.delete('favorite-1');

    expect(favorite.delete).toHaveBeenCalledWith({ where: { id: 'favorite-1' } });
  });

  it('listByCustomer() returns favorites ordered by createdAt desc', async () => {
    const { prisma, favorite } = buildPrismaServiceMock();
    favorite.findMany.mockResolvedValue([sampleRecord()]);
    const repository = new PrismaFavoriteRepository(prisma);

    const result = await repository.listByCustomer('customer-1');

    expect(favorite.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { customerId: 'customer-1' }, orderBy: { createdAt: 'desc' } }),
    );
    expect(result).toHaveLength(1);
  });
});
