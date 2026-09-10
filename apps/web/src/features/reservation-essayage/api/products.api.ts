import { useQuery } from '@tanstack/react-query';
import type { ProductDto } from '@angaly/types';

import { apiClient } from '@/lib/api-client';

import { QUERY_KEYS } from '../consts/queryKeys';

/**
 * `GET /api/products/:id` doesn't exist yet — the backend only exposes `GET /api/products`
 * (list) and `GET /api/products/:slug` (see
 * `apps/api/src/products/presentation/controllers/products.controller.ts`), while
 * `fiche-produit`'s "Réserver pour essayage" link passes a real `productId` (not a slug).
 * `IProductRepository.findById` already exists domain-side (added for `customers` favorites
 * hydration), so exposing it here is a small, well-contained backend follow-up — flagged in
 * docs/pages/reservation-essayage.md "Points d'attention" rather than built in this
 * frontend-only pass (see the `new-page-from-stitch` skill's step 4). Mocked via MSW for now
 * at the route this endpoint would use once added: `GET /products/id/:id`.
 */
export function useProductSummaryQuery(productId: string) {
  return useQuery({
    queryKey: QUERY_KEYS.product(productId),
    queryFn: () => apiClient.get<ProductDto>(`/products/id/${encodeURIComponent(productId)}`),
    enabled: Boolean(productId),
  });
}
