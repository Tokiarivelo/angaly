import { Prisma } from '@angaly/database';

import { PrismaProductRepository } from '../../infrastructure/repositories/prisma-product.repository';
import type { ProductRecord, ProductVariantRecord } from '../../infrastructure/repositories/prisma-product.repository';
import type { PrismaService } from '../../../prisma/prisma.service';

interface MockProductDelegate {
  findUnique: jest.Mock;
  findMany: jest.Mock;
  count: jest.Mock;
}
interface MockProductVariantDelegate {
  findUnique: jest.Mock;
}

function buildPrismaServiceMock(): {
  prisma: PrismaService;
  product: MockProductDelegate;
  productVariant: MockProductVariantDelegate;
} {
  const product: MockProductDelegate = { findUnique: jest.fn(), findMany: jest.fn(), count: jest.fn() };
  const productVariant: MockProductVariantDelegate = { findUnique: jest.fn() };
  const prisma = { product, productVariant } as unknown as PrismaService;
  return { prisma, product, productVariant };
}

function variantRecord(): ProductVariantRecord {
  return {
    id: 'variant-1',
    productId: 'product-1',
    sku: 'ROB-001-S-BLEU',
    size: 'S',
    color: 'Bleu',
    material: null,
    priceOverride: null,
    inventory: { quantityAvailable: 10, quantityReserved: 3 },
    media: [],
  };
}

function sampleRecord(): ProductRecord {
  return {
    id: 'product-1',
    sku: 'ROB-001',
    slug: 'robe-cocktail',
    name: 'Robe Cocktail',
    description: 'Une robe de cocktail.',
    price: new Prisma.Decimal('150000.00'),
    currency: 'MGA',
    status: 'AVAILABLE',
    createdAt: new Date(),
    updatedAt: new Date(),
    category: { id: 'cat-1', slug: 'robes', name: 'Robes' },
    media: [],
    variants: [variantRecord()],
  };
}

describe('PrismaProductRepository', () => {
  it('findBySlug() returns null when no row matches', async () => {
    const { prisma, product } = buildPrismaServiceMock();
    product.findUnique.mockResolvedValue(null);
    const repository = new PrismaProductRepository(prisma);

    expect(await repository.findBySlug('missing')).toBeNull();
  });

  it('findById() returns null when no row matches', async () => {
    const { prisma, product } = buildPrismaServiceMock();
    product.findUnique.mockResolvedValue(null);
    const repository = new PrismaProductRepository(prisma);

    expect(await repository.findById('missing')).toBeNull();
  });

  it('findById() maps the row to a domain entity when found', async () => {
    const { prisma, product } = buildPrismaServiceMock();
    product.findUnique.mockResolvedValue(sampleRecord());
    const repository = new PrismaProductRepository(prisma);

    const result = await repository.findById('product-1');

    expect(result?.id).toBe('product-1');
    expect(product.findUnique).toHaveBeenCalledWith(expect.objectContaining({ where: { id: 'product-1' } }));
  });

  it('findBySlug() maps the row to a domain entity when found', async () => {
    const { prisma, product } = buildPrismaServiceMock();
    product.findUnique.mockResolvedValue(sampleRecord());
    const repository = new PrismaProductRepository(prisma);

    const result = await repository.findBySlug('robe-cocktail');

    expect(result?.slug).toBe('robe-cocktail');
  });

  it('list() applies category/size/color/material filters via a variants.some clause', async () => {
    const { prisma, product } = buildPrismaServiceMock();
    product.findMany.mockResolvedValue([]);
    product.count.mockResolvedValue(0);
    const repository = new PrismaProductRepository(prisma);

    await repository.list({ categoryId: 'cat-1', size: 'S', color: 'Bleu', material: 'Coton', page: 1, limit: 20 });

    expect(product.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { categoryId: 'cat-1', variants: { some: { size: 'S', color: 'Bleu', material: 'Coton' } } },
      }),
    );
  });

  it('list() applies a status filter', async () => {
    const { prisma, product } = buildPrismaServiceMock();
    product.findMany.mockResolvedValue([]);
    product.count.mockResolvedValue(0);
    const repository = new PrismaProductRepository(prisma);

    await repository.list({ categoryId: 'cat-1', status: 'LAST_PIECE', page: 1, limit: 20 });

    expect(product.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { categoryId: 'cat-1', status: 'LAST_PIECE' } }));
  });

  it('list() applies a price range filter', async () => {
    const { prisma, product } = buildPrismaServiceMock();
    product.findMany.mockResolvedValue([]);
    product.count.mockResolvedValue(0);
    const repository = new PrismaProductRepository(prisma);

    await repository.list({ categoryId: 'cat-1', priceMin: '50000.00', priceMax: '250000.00', page: 1, limit: 20 });

    expect(product.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { categoryId: 'cat-1', price: { gte: '50000.00', lte: '250000.00' } },
      }),
    );
  });

  it('list() sorts by price ascending/descending, defaulting to newest', async () => {
    const { prisma, product } = buildPrismaServiceMock();
    product.findMany.mockResolvedValue([]);
    product.count.mockResolvedValue(0);
    const repository = new PrismaProductRepository(prisma);

    await repository.list({ categoryId: 'cat-1', sort: 'priceAsc', page: 1, limit: 20 });
    expect(product.findMany).toHaveBeenCalledWith(expect.objectContaining({ orderBy: [{ price: 'asc' }] }));

    await repository.list({ categoryId: 'cat-1', sort: 'priceDesc', page: 1, limit: 20 });
    expect(product.findMany).toHaveBeenCalledWith(expect.objectContaining({ orderBy: [{ price: 'desc' }] }));

    await repository.list({ categoryId: 'cat-1', page: 1, limit: 20 });
    expect(product.findMany).toHaveBeenCalledWith(expect.objectContaining({ orderBy: [{ createdAt: 'desc' }] }));
  });

  it('listSimilar() excludes the current product within the same category', async () => {
    const { prisma, product } = buildPrismaServiceMock();
    product.findMany.mockResolvedValue([sampleRecord()]);
    const repository = new PrismaProductRepository(prisma);

    const result = await repository.listSimilar({ categoryId: 'cat-1', excludeProductId: 'product-1', limit: 4 });

    expect(product.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { categoryId: 'cat-1', id: { not: 'product-1' } }, take: 4 }),
    );
    expect(result).toHaveLength(1);
  });

  it('findVariantById() returns null when no row matches', async () => {
    const { prisma, productVariant } = buildPrismaServiceMock();
    productVariant.findUnique.mockResolvedValue(null);
    const repository = new PrismaProductRepository(prisma);

    expect(await repository.findVariantById('missing')).toBeNull();
  });

  it('findVariantById() maps the row to a domain entity when found', async () => {
    const { prisma, productVariant } = buildPrismaServiceMock();
    productVariant.findUnique.mockResolvedValue(variantRecord());
    const repository = new PrismaProductRepository(prisma);

    const result = await repository.findVariantById('variant-1');

    expect(result?.id).toBe('variant-1');
    expect(result?.availableToSell).toBe(7);
  });
});
