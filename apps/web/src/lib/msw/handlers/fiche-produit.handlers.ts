import { HttpResponse, http } from 'msw';
import type { ProductDto } from '@angaly/types';

/** Default `GET /products/:slug` fallback — tests needing specific content use `server.use()`. */
const API_BASE_URL = 'http://localhost:3003/api';

export function sampleProductDetail(overrides: Partial<ProductDto> = {}): ProductDto {
  return {
    id: 'product-1',
    sku: 'AGL-RS-014',
    slug: 'robe-solene',
    name: 'Robe Solène',
    description:
      "La Robe Solène incarne l'élégance intemporelle de la maison ANGALY, confectionnée dans nos ateliers malgaches.",
    price: { amount: '890000', currency: 'MGA' },
    status: 'AVAILABLE' as ProductDto['status'],
    category: { id: 'cat-robes', slug: 'robes', name: 'Robes' },
    media: [
      { id: 'media-1', url: 'http://localhost:9000/products/robe-solene-1.jpg', altText: 'Robe Solène — vue de face', sortOrder: 0 },
      { id: 'media-2', url: 'http://localhost:9000/products/robe-solene-2.jpg', altText: 'Robe Solène — détail', sortOrder: 1 },
    ],
    variants: [
      {
        id: 'variant-1',
        sku: 'AGL-RS-014-36-BLEU',
        size: '36',
        color: 'Bleu Nuit',
        material: 'Soie sauvage',
        priceOverride: null,
        quantityAvailable: 3,
        quantityReserved: 0,
      },
      {
        id: 'variant-2',
        sku: 'AGL-RS-014-38-CHAMPAGNE',
        size: '38',
        color: 'Champagne',
        material: 'Soie sauvage',
        priceOverride: null,
        quantityAvailable: 0,
        quantityReserved: 0,
      },
    ],
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

export const ficheProduitHandlers = [
  http.get(`${API_BASE_URL}/products/:slug`, ({ params }) =>
    HttpResponse.json({ success: true, data: sampleProductDetail({ slug: params['slug'] as string }) }),
  ),
];
