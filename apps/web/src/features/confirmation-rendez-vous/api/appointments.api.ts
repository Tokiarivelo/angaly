import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { AppointmentDto, AtelierDto } from '@angaly/types';

import { apiClient } from '@/lib/api-client';

import { QUERY_KEYS } from '../consts/queryKeys';

/** Real endpoint — see docs/features/appointments.md. Public route (référence = jeton de consultation). */
export function useAppointmentQuery(reference: string) {
  return useQuery({
    queryKey: QUERY_KEYS.appointment(reference),
    queryFn: () => apiClient.get<AppointmentDto>(`/appointments/${encodeURIComponent(reference)}`),
    enabled: Boolean(reference),
  });
}

/**
 * `GET /api/ateliers/:id` doesn't exist (backend only exposes `:slug`, see
 * `apps/api/src/ateliers/presentation/controllers/ateliers.controller.ts`) — fetches the
 * full list instead, same low-volume assumption as `nos-ateliers-liste`/`prendre-rendez-vous`.
 */
export function useAteliersQuery() {
  return useQuery({
    queryKey: QUERY_KEYS.ateliers,
    queryFn: () => apiClient.get<AtelierDto[]>('/ateliers'),
  });
}

/** Real endpoint — see docs/features/appointments.md. Public route (référence = jeton). */
export function useCancelAppointmentMutation(reference: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => apiClient.post<AppointmentDto>(`/appointments/${encodeURIComponent(reference)}/cancel`),
    onSuccess: (appointment) => {
      queryClient.setQueryData(QUERY_KEYS.appointment(reference), appointment);
    },
  });
}
