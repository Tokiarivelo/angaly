'use client';

import { useQuery } from '@tanstack/react-query';
import type { OrderDto } from '@angaly/types';

import { apiClient } from '@/lib/api-client';

/**
 * No `GET /api/orders/:orderNumber` exists server-side — only `GET /api/orders/:id`
 * and `GET /api/orders` (list-by-customer), see
 * apps/api/src/orders/presentation/controllers/orders.controller.ts. Resolves the
 * order by `orderNumber` client-side from the caller's own order list, same
 * low-volume assumption as `confirmation-rendez-vous`'s `useAteliersQuery`.
 */
export function useOrderByNumberQuery(orderNumber: string) {
  return useQuery({
    queryKey: ['suivi-commande', 'orders'],
    queryFn: () => apiClient.get<OrderDto[]>('/orders'),
    select: (orders) => orders.find((order) => order.orderNumber === orderNumber) ?? null,
    enabled: Boolean(orderNumber),
  });
}
