'use client';

import { useQuery } from '@tanstack/react-query';
import type { OrderDto, PaymentDto } from '@angaly/types';

import { apiClient } from '@/lib/api-client';

import { QUERY_KEYS } from '../consts/queryKeys';

/** Real endpoint — `GET /api/payments` (list-by-customer, see docs/features/payments.md). */
export function usePaymentsQuery() {
  return useQuery({
    queryKey: QUERY_KEYS.payments,
    queryFn: () => apiClient.get<PaymentDto[]>('/payments'),
  });
}

/** Real endpoint — `GET /api/orders`. Joined locally to resolve each payment's `orderNumber` (see docs/pages/messages-factures-notifications.md). */
export function useOrdersQuery() {
  return useQuery({
    queryKey: QUERY_KEYS.orders,
    queryFn: () => apiClient.get<OrderDto[]>('/orders'),
  });
}
