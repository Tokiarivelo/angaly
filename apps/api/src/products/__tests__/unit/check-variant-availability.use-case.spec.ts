import { NotFoundException } from '@nestjs/common';

import { CheckVariantAvailabilityUseCase } from '../../application/use-cases/check-variant-availability.use-case';
import { ProductVariantEntity } from '../../domain/entities/product-variant.entity';
import type { IProductRepository } from '../../domain/repositories/product.repository';

function buildRepository(): jest.Mocked<IProductRepository> {
  return { findBySlug: jest.fn(), findById: jest.fn(), list: jest.fn(), listSimilar: jest.fn(), findVariantById: jest.fn() };
}

function sampleVariant(quantityAvailable: number, quantityReserved: number): ProductVariantEntity {
  return ProductVariantEntity.create({
    id: 'variant-1',
    productId: 'product-1',
    sku: 'ROB-001-S-BLEU',
    size: 'S',
    color: 'Bleu',
    material: null,
    priceOverride: null,
    quantityAvailable,
    quantityReserved,
  });
}

describe('CheckVariantAvailabilityUseCase', () => {
  it('reports available when stock covers the requested quantity', async () => {
    const repository = buildRepository();
    repository.findVariantById.mockResolvedValue(sampleVariant(10, 2));
    const useCase = new CheckVariantAvailabilityUseCase(repository);

    const result = await useCase.execute('variant-1', 5);

    expect(result).toEqual({
      variantId: 'variant-1',
      quantityAvailable: 10,
      quantityReserved: 2,
      availableToSell: 8,
      isAvailable: true,
    });
  });

  it('reports unavailable when stock does not cover the requested quantity', async () => {
    const repository = buildRepository();
    repository.findVariantById.mockResolvedValue(sampleVariant(3, 2));
    const useCase = new CheckVariantAvailabilityUseCase(repository);

    const result = await useCase.execute('variant-1', 5);

    expect(result.isAvailable).toBe(false);
    expect(result.availableToSell).toBe(1);
  });

  it('defaults the requested quantity to 1', async () => {
    const repository = buildRepository();
    repository.findVariantById.mockResolvedValue(sampleVariant(1, 0));
    const useCase = new CheckVariantAvailabilityUseCase(repository);

    const result = await useCase.execute('variant-1');

    expect(result.isAvailable).toBe(true);
  });

  it('throws NotFoundException for an unknown variant', async () => {
    const repository = buildRepository();
    repository.findVariantById.mockResolvedValue(null);
    const useCase = new CheckVariantAvailabilityUseCase(repository);

    await expect(useCase.execute('missing')).rejects.toThrow(NotFoundException);
  });
});
