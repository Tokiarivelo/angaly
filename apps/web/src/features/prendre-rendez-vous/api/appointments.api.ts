import { useMutation, useQuery } from '@tanstack/react-query';
import type { AppointmentDto, AtelierDto, DaySlotsResponseDto, MonthAvailabilityDayDto } from '@angaly/types';

import { apiClient } from '@/lib/api-client';

import { QUERY_KEYS } from '../consts/queryKeys';

/** Real endpoint — see docs/features/ateliers.md. */
export function useAteliersQuery() {
  return useQuery({
    queryKey: QUERY_KEYS.ateliers,
    queryFn: () => apiClient.get<AtelierDto[]>('/ateliers'),
  });
}

/** Real endpoint — see docs/features/appointments.md. `month` is `YYYY-MM`. */
export function useMonthAvailabilityQuery(atelierId: string, month: string) {
  return useQuery({
    queryKey: QUERY_KEYS.monthAvailability(atelierId, month),
    queryFn: () =>
      apiClient.get<MonthAvailabilityDayDto[]>(
        `/appointments/availability?atelierId=${encodeURIComponent(atelierId)}&month=${encodeURIComponent(month)}`,
      ),
    enabled: Boolean(atelierId),
  });
}

/** Real endpoint — see docs/features/appointments.md. `date` is `YYYY-MM-DD`. */
export function useDaySlotsQuery(atelierId: string, date: string) {
  return useQuery({
    queryKey: QUERY_KEYS.daySlots(atelierId, date),
    queryFn: () =>
      apiClient.get<DaySlotsResponseDto>(
        `/appointments/availability/slots?atelierId=${encodeURIComponent(atelierId)}&date=${encodeURIComponent(date)}`,
      ),
    enabled: Boolean(atelierId && date),
  });
}

export interface CreateAppointmentPayload {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  type: string;
  atelierId: string;
  scheduledAt: string;
  message: string | null;
}

/** Real endpoint — see docs/features/appointments.md. Public route, optionally enriched server-side if the visitor is a connected CLIENT. */
export function useCreateAppointmentMutation() {
  return useMutation({
    mutationFn: (payload: CreateAppointmentPayload) => apiClient.post<AppointmentDto>('/appointments', payload),
  });
}
