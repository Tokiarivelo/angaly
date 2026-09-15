import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import type { ProductDto, ProductVariantDto } from '@angaly/types';

import { ProductGallery } from '../ui/ProductGallery';

/** The main enlargeable image — queried separately from the thumbnail rail, which can repeat the same alt text. */
function mainImage() {
  return within(screen.getByRole('button', { name: "Agrandir l'image" }));
}

const product: ProductDto = {
  id: 'product-1',
  sku: 'AGL-RS-014',
  slug: 'robe-solene',
  name: 'Robe Solène',
  description: '',
  price: { amount: '890000', currency: 'MGA' },
  status: 'AVAILABLE' as ProductDto['status'],
  category: { id: 'cat-1', slug: 'robes', name: 'Robes' },
  media: [
    { id: 'shared-1', url: 'http://localhost:9000/products/shared-1.jpg', altText: 'Robe Solène — vue de face', sortOrder: 0 },
    { id: 'shared-2', url: 'http://localhost:9000/products/shared-2.jpg', altText: 'Robe Solène — détail', sortOrder: 1 },
  ],
  variants: [],
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

function variant(overrides: Partial<ProductVariantDto>): ProductVariantDto {
  return {
    id: 'variant-1',
    sku: 'AGL-RS-014-36',
    size: '36',
    color: 'Bleu Nuit',
    material: null,
    priceOverride: null,
    quantityAvailable: 3,
    quantityReserved: 0,
    media: [],
    ...overrides,
  };
}

describe('ProductGallery', () => {
  it('shows the product\'s shared media when no variant is selected', () => {
    render(<ProductGallery product={product} selectedVariant={null} />);
    expect(mainImage().getByAltText('Robe Solène — vue de face')).toBeInTheDocument();
  });

  it("shows the product's shared media when the selected variant has no dedicated photos", () => {
    render(<ProductGallery product={product} selectedVariant={variant({ media: [] })} />);
    expect(mainImage().getByAltText('Robe Solène — vue de face')).toBeInTheDocument();
  });

  it('swaps to the selected variant\'s own photos when it has some', () => {
    const navyVariant = variant({
      color: 'Bleu Nuit',
      media: [{ id: 'navy-1', url: 'http://localhost:9000/products/navy-1.jpg', altText: 'Robe Solène — Bleu Nuit', sortOrder: 0 }],
    });

    render(<ProductGallery product={product} selectedVariant={navyVariant} />);

    expect(mainImage().getByAltText('Robe Solène — Bleu Nuit')).toBeInTheDocument();
    expect(screen.queryByAltText('Robe Solène — vue de face')).not.toBeInTheDocument();
  });

  it('re-renders on the new color\'s first photo after viewing a later thumbnail of the previous color', async () => {
    const user = userEvent.setup();
    const bleu = variant({
      id: 'variant-bleu',
      color: 'Bleu Nuit',
      media: [
        { id: 'bleu-1', url: 'http://localhost:9000/products/bleu-1.jpg', altText: 'Bleu 1', sortOrder: 0 },
        { id: 'bleu-2', url: 'http://localhost:9000/products/bleu-2.jpg', altText: 'Bleu 2', sortOrder: 1 },
      ],
    });
    const champagne = variant({
      id: 'variant-champagne',
      color: 'Champagne',
      media: [{ id: 'champagne-1', url: 'http://localhost:9000/products/champagne-1.jpg', altText: 'Champagne 1', sortOrder: 0 }],
    });

    const { rerender } = render(<ProductGallery product={product} selectedVariant={bleu} />);

    await user.click(screen.getByRole('button', { name: "Voir l'image 2" }));
    expect(mainImage().getByAltText('Bleu 2')).toBeInTheDocument();

    rerender(<ProductGallery product={product} selectedVariant={champagne} />);

    expect(mainImage().getByAltText('Champagne 1')).toBeInTheDocument();
  });
});
