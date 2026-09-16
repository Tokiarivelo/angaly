'use client';

import { useMutation } from '@tanstack/react-query';
import type { InitiatePaymentPayload, PaymentDto } from '@angaly/types';

import { apiClient } from '@/lib/api-client';

/** Real endpoint — see docs/features/payments.md. Requires an authenticated CLIENT (JwtAuthGuard). */
export function useInitiatePaymentMutation() {
  return useMutation({
    mutationFn: (payload: InitiatePaymentPayload) => apiClient.post<PaymentDto>('/payments', payload),
  });
}
