import { Prisma } from '@angaly/database';

import { ProductMapper } from '../../infrastructure/mappers/product.mapper';
import type { ProductRecord, ProductVariantRecord } from '../../infrastructure/repositories/prisma-product.repository';

function variantRecord(overrides: Partial<ProductVariantRecord> = {}): ProductVariantRecord {
  return {
    id: 'variant-1',
    productId: 'product-1',
    sku: 'ROB-001-S-BLEU',
    size: 'S',
    color: 'Bleu',
    material: null,
    priceOverride: null,
    inventory: { quantityAvailable: 10, quantityReserved: 3 },
    ...overrides,
  };
}

function productRecord(overrides: Partial<ProductRecord> = {}): ProductRecord {
  return {
    id: 'product-1',
    sku: 'ROB-001',
    slug: 'robe-cocktail',
    name: 'Robe Cocktail',
    description: 'Une robe de cocktail.',
    price: new Prisma.Decimal('150000.00'),
    currency: 'MGA',
    status: 'AVAILABLE',
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-02T00:00:00.000Z'),
    category: { id: 'cat-1', slug: 'robes', name: 'Robes' },
    media: [{ id: 'media-1', url: 'http://localhost:9000/products/a.jpg', altText: null, sortOrder: 0 }],
    variants: [variantRecord()],
    ...overrides,
  };
}

describe('ProductMapper', () => {
  it('maps a Prisma record to a domain entity, converting the Decimal price to a string', () => {
    const entity = ProductMapper.toDomain(productRecord());

    expect(entity.price).toEqual({ amount: '150000', currency: 'MGA' });
    expect(entity.media[0]?.altText).toBe('');
    expect(entity.variants).toHaveLength(1);
    expect(entity.variants[0]?.availableToSell).toBe(7);
  });

  it('defaults a variant with no Inventory row to 0/0', () => {
    const entity = ProductMapper.toDomain(productRecord({ variants: [variantRecord({ inventory: null })] }));

    expect(entity.variants[0]?.quantityAvailable).toBe(0);
    expect(entity.variants[0]?.quantityReserved).toBe(0);
  });

  it('maps a variant priceOverride Decimal to a Price with the product currency', () => {
    const entity = ProductMapper.toDomain(
      productRecord({ variants: [variantRecord({ priceOverride: new Prisma.Decimal('99000.00') })] }),
    );

    expect(entity.variants[0]?.priceOverride).toEqual({ amount: '99000', currency: 'MGA' });
  });

  it('maps a domain entity to a response DTO with ISO date strings', () => {
    const entity = ProductMapper.toDomain(productRecord());
    const dto = ProductMapper.toResponseDto(entity);

    expect(dto.createdAt).toBe('2026-01-01T00:00:00.000Z');
    expect(dto.price).toEqual({ amount: '150000', currency: 'MGA' });
    expect(dto.variants).toHaveLength(1);
  });
});
