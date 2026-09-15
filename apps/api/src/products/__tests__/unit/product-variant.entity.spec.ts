import type { ProductVariantProps } from '../../domain/entities/product-variant.entity';
import { ProductVariantEntity } from '../../domain/entities/product-variant.entity';

function baseProps(): ProductVariantProps {
  return {
    id: 'variant-1',
    productId: 'product-1',
    sku: 'ROB-S-BLEU',
    size: 'S',
    color: 'Bleu',
    material: 'Coton',
    priceOverride: null,
    quantityAvailable: 10,
    quantityReserved: 3,
    media: [],
  };
}

describe('ProductVariantEntity', () => {
  it('creates a valid entity and exposes its properties via getters', () => {
    const entity = ProductVariantEntity.create(baseProps());

    expect(entity.id).toBe('variant-1');
    expect(entity.size).toBe('S');
    expect(entity.color).toBe('Bleu');
    expect(entity.material).toBe('Coton');
    expect(entity.quantityAvailable).toBe(10);
    expect(entity.quantityReserved).toBe(3);
  });

  it('computes availableToSell as quantityAvailable - quantityReserved', () => {
    const entity = ProductVariantEntity.create(baseProps());
    expect(entity.availableToSell).toBe(7);
  });

  it('never returns a negative availableToSell', () => {
    const entity = ProductVariantEntity.create({ ...baseProps(), quantityAvailable: 2, quantityReserved: 5 });
    expect(entity.availableToSell).toBe(0);
  });

  it('accepts a priceOverride', () => {
    const entity = ProductVariantEntity.create({
      ...baseProps(),
      priceOverride: { amount: '99000.00', currency: 'MGA' },
    });
    expect(entity.priceOverride).toEqual({ amount: '99000.00', currency: 'MGA' });
  });

  it('rejects an empty size', () => {
    expect(() => ProductVariantEntity.create({ ...baseProps(), size: ' ' })).toThrow(
      'ProductVariant.size must not be empty',
    );
  });

  it('rejects an empty color', () => {
    expect(() => ProductVariantEntity.create({ ...baseProps(), color: '' })).toThrow(
      'ProductVariant.color must not be empty',
    );
  });

  it('exposes its colorway-specific media, empty by default', () => {
    const withoutMedia = ProductVariantEntity.create(baseProps());
    expect(withoutMedia.media).toEqual([]);

    const media = [{ id: 'media-1', url: 'https://minio.local/variant.jpg', altText: 'Bleu', sortOrder: 0 }];
    const withMedia = ProductVariantEntity.create({ ...baseProps(), media });
    expect(withMedia.media).toEqual(media);
  });
});
