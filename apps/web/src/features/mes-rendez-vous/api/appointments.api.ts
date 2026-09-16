'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { AppointmentDto, AtelierDto } from '@angaly/types';

import { apiClient } from '@/lib/api-client';

import { QUERY_KEYS } from '../consts/queryKeys';

/** Real endpoint — see docs/features/appointments.md. Requires an authenticated CLIENT (JwtAuthGuard). */
export function useMyAppointmentsQuery() {
  return useQuery({
    queryKey: QUERY_KEYS.appointments,
    queryFn: () => apiClient.get<AppointmentDto[]>('/appointments'),
  });
}

/**
 * `GET /api/ateliers/:id` doesn't exist (backend only exposes `:slug`, see
 * apps/api/src/ateliers/presentation/controllers/ateliers.controller.ts) — fetches the
 * full list instead, same low-volume assumption as `confirmation-rendez-vous`.
 */
export function useAteliersQuery() {
  return useQuery({
    queryKey: QUERY_KEYS.ateliers,
    queryFn: () => apiClient.get<AtelierDto[]>('/ateliers'),
  });
}

/** Real endpoint — see docs/features/appointments.md. Public route (référence = jeton), but always called by an authenticated client here. */
export function useCancelAppointmentMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (reference: string) => apiClient.post<AppointmentDto>(`/appointments/${encodeURIComponent(reference)}/cancel`),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.appointments });
    },
  });
}
