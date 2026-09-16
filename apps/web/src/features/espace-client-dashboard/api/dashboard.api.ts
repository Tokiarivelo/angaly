'use client';

import { useQuery } from '@tanstack/react-query';
import type { AppointmentDto, AtelierDto, CustomerDto, NotificationDto, OrderDto, PatternProjectDto } from '@angaly/types';

import { apiClient } from '@/lib/api-client';

import { QUERY_KEYS } from '../consts/queryKeys';

/** Real endpoint — see docs/features/customers.md. Powers the "Bonjour, {prénom}" header. */
export function useCustomerProfileQuery() {
  return useQuery({
    queryKey: QUERY_KEYS.customerProfile,
    queryFn: () => apiClient.get<CustomerDto>('/customers/me'),
  });
}

/** Real endpoint — see docs/features/appointments.md. Own appointments only (CLIENT). */
export function useMyAppointmentsQuery() {
  return useQuery({
    queryKey: QUERY_KEYS.appointments,
    queryFn: () => apiClient.get<AppointmentDto[]>('/appointments'),
  });
}

/** Real endpoint — see docs/features/orders.md. Own orders only (CLIENT). */
export function useMyOrdersQuery() {
  return useQuery({
    queryKey: QUERY_KEYS.orders,
    queryFn: () => apiClient.get<OrderDto[]>('/orders'),
  });
}

/** Real endpoint — see docs/features/notifications.md. */
export function useMyNotificationsQuery() {
  return useQuery({
    queryKey: QUERY_KEYS.notifications,
    queryFn: () => apiClient.get<NotificationDto[]>('/notifications'),
  });
}

/**
 * `GET /api/ateliers/:id` doesn't exist (backend only exposes `:slug`) —
 * fetches the full (small) list instead, same assumption as `mes-rendez-vous`.
 */
export function useAteliersQuery() {
  return useQuery({
    queryKey: ['espace-client-dashboard', 'ateliers'] as const,
    queryFn: () => apiClient.get<AtelierDto[]>('/ateliers'),
  });
}

/**
 * Real endpoint (`GET /api/pattern-projects?mine=true`) — same call shape as
 * `mes-projets-patron`'s `fetchMyPatternProjects` (duplicated per feature-sliced
 * independence). Never throws: an empty dashboard card is preferable to a
 * failed aggregate render for a widget this secondary.
 */
export function useMyPatternProjectsQuery() {
  return useQuery({
    queryKey: QUERY_KEYS.patternProjects,
    queryFn: async () => {
      try {
        const res = await apiClient.get<PatternProjectDto[] | { data: PatternProjectDto[] }>('/pattern-projects?mine=true');
        return Array.isArray(res) ? res : (res?.data ?? []);
      } catch {
        return [];
      }
    },
  });
}
