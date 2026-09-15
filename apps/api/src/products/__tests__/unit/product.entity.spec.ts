import type { ProductProps } from '../../domain/entities/product.entity';
import { ProductEntity } from '../../domain/entities/product.entity';
import { ProductVariantEntity } from '../../domain/entities/product-variant.entity';

function baseProps(): ProductProps {
  return {
    id: 'product-1',
    sku: 'ROB-001',
    slug: 'robe-cocktail',
    name: 'Robe Cocktail',
    description: 'Une robe de cocktail prêt-à-porter.',
    price: { amount: '150000.00', currency: 'MGA' },
    status: 'AVAILABLE',
    category: { id: 'cat-1', slug: 'robes', name: 'Robes' },
    media: [{ id: 'media-1', url: 'http://localhost:9000/products/a.jpg', altText: 'Vue de face', sortOrder: 0 }],
    variants: [
      ProductVariantEntity.create({
        id: 'variant-1',
        productId: 'product-1',
        sku: 'ROB-001-S-BLEU',
        size: 'S',
        color: 'Bleu',
        material: null,
        priceOverride: null,
        quantityAvailable: 5,
        quantityReserved: 0,
        media: [],
      }),
    ],
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-02T00:00:00.000Z'),
  };
}

describe('ProductEntity', () => {
  it('creates a valid entity and exposes its properties via getters', () => {
    const entity = ProductEntity.create(baseProps());

    expect(entity.id).toBe('product-1');
    expect(entity.sku).toBe('ROB-001');
    expect(entity.slug).toBe('robe-cocktail');
    expect(entity.status).toBe('AVAILABLE');
    expect(entity.price).toEqual({ amount: '150000.00', currency: 'MGA' });
    expect(entity.category.name).toBe('Robes');
    expect(entity.variants).toHaveLength(1);
  });

  it('rejects an empty sku', () => {
    expect(() => ProductEntity.create({ ...baseProps(), sku: ' ' })).toThrow('Product.sku must not be empty');
  });

  it('rejects an empty slug', () => {
    expect(() => ProductEntity.create({ ...baseProps(), slug: '' })).toThrow('Product.slug must not be empty');
  });

  it('rejects an unknown status', () => {
    expect(() => ProductEntity.create({ ...baseProps(), status: 'DISCONTINUED' })).toThrow(
      'Product.status must be a recognized ProductAvailability, got "DISCONTINUED"',
    );
  });
});
