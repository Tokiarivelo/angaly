'use client';

import { useMutation, useQuery } from '@tanstack/react-query';
import type { CreateOrderPayload, OrderDto } from '@angaly/types';

import { apiClient } from '@/lib/api-client';

import { CHECKOUT_QUERY_KEYS } from '../consts/query-keys.const';

/** Real endpoint — see docs/features/orders.md. Requires an authenticated CLIENT (JwtAuthGuard). */
export function useCreateOrderMutation() {
  return useMutation({
    mutationFn: (payload: CreateOrderPayload) => apiClient.post<OrderDto>('/orders', payload),
  });
}

/** Powers the confirmation step's recap once the order exists. */
export function useOrderQuery(orderId: string | null) {
  return useQuery({
    queryKey: CHECKOUT_QUERY_KEYS.order(orderId),
    queryFn: () => apiClient.get<OrderDto>(`/orders/${orderId}`),
    enabled: Boolean(orderId),
  });
}
