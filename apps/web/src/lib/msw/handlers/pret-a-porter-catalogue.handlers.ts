import { HttpResponse, http } from 'msw';
import type { FavoriteDto, ProductDto } from '@angaly/types';

/** Default fallbacks — tests needing specific content use `server.use()`. Categories reuse the generic categories.handlers.ts default. */
const API_BASE_URL = 'http://localhost:3003/api';

export const SAMPLE_PRODUCTS: ProductDto[] = [
  {
    id: 'product-1',
    sku: 'ANG-24-001',
    slug: 'robe-saphir',
    name: 'Robe Saphir',
    description: 'Une robe du soir raffinée.',
    price: { amount: '2450000', currency: 'MGA' },
    status: 'LAST_PIECE' as ProductDto['status'],
    category: { id: 'cat-robes', slug: 'robes', name: 'Robes du Soir' },
    media: [{ id: 'media-1', url: 'http://localhost:9000/products/robe-saphir.jpg', altText: 'Robe Saphir', sortOrder: 0 }],
    variants: [
      {
        id: 'variant-1',
        sku: 'ANG-24-001-36-NAVY',
        size: '36',
        color: 'Navy',
        material: null,
        priceOverride: null,
        quantityAvailable: 1,
        quantityReserved: 0,
      },
    ],
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
];

export const pretAPorterCatalogueHandlers = [
  http.get(`${API_BASE_URL}/products`, () =>
    HttpResponse.json({
      success: true,
      data: {
        data: SAMPLE_PRODUCTS,
        meta: { total: 1, page: 1, limit: 12, totalPages: 1, hasNextPage: false, hasPreviousPage: false },
      },
    }),
  ),
  http.get(`${API_BASE_URL}/favorites`, () => HttpResponse.json({ success: true, data: [] as FavoriteDto[] })),
  http.post(`${API_BASE_URL}/favorites`, () =>
    HttpResponse.json({
      success: true,
      data: {
        id: 'favorite-1',
        entityType: 'PRODUCT' as FavoriteDto['entityType'],
        entityId: 'product-1',
        createdAt: '2026-01-01T00:00:00.000Z',
        display: null,
      } satisfies FavoriteDto,
    }),
  ),
  // apps/api's ResponseInterceptor always wraps a body, even on 204 — {"success":true} here matches that exactly.
  http.delete(`${API_BASE_URL}/favorites/:id`, () => HttpResponse.json({ success: true }, { status: 204 })),
];
