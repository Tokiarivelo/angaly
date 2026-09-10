import { NotFoundException } from '@nestjs/common';

import { GetProductBySlugUseCase } from '../../application/use-cases/get-product-by-slug.use-case';
import { ProductEntity } from '../../domain/entities/product.entity';
import type { IProductRepository } from '../../domain/repositories/product.repository';

function buildRepository(): jest.Mocked<IProductRepository> {
  return { findBySlug: jest.fn(), findById: jest.fn(), list: jest.fn(), listSimilar: jest.fn(), findVariantById: jest.fn() };
}

function sampleProduct(): ProductEntity {
  return ProductEntity.create({
    id: 'product-1',
    sku: 'ROB-001',
    slug: 'robe-cocktail',
    name: 'Robe Cocktail',
    description: 'Une robe de cocktail.',
    price: { amount: '150000.00', currency: 'MGA' },
    status: 'AVAILABLE',
    category: { id: 'cat-1', slug: 'robes', name: 'Robes' },
    media: [],
    variants: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

describe('GetProductBySlugUseCase', () => {
  it('returns the product for a known slug', async () => {
    const repository = buildRepository();
    repository.findBySlug.mockResolvedValue(sampleProduct());
    const useCase = new GetProductBySlugUseCase(repository);

    const result = await useCase.execute('robe-cocktail');

    expect(result.slug).toBe('robe-cocktail');
  });

  it('throws NotFoundException for an unknown slug', async () => {
    const repository = buildRepository();
    repository.findBySlug.mockResolvedValue(null);
    const useCase = new GetProductBySlugUseCase(repository);

    await expect(useCase.execute('missing')).rejects.toThrow(NotFoundException);
  });
});
