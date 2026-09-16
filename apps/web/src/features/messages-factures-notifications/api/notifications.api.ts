'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { NotificationDto } from '@angaly/types';

import { apiClient } from '@/lib/api-client';

import { QUERY_KEYS } from '../consts/queryKeys';

/** Real endpoint — `GET /api/notifications` (see apps/api/src/notifications/presentation/controllers/notifications.controller.ts). */
export function useNotificationsQuery() {
  return useQuery({
    queryKey: QUERY_KEYS.notifications,
    queryFn: () => apiClient.get<NotificationDto[]>('/notifications'),
  });
}

/** Real endpoint — `PATCH /api/notifications/:id/read`. */
export function useMarkNotificationReadMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.patch<NotificationDto>(`/notifications/${encodeURIComponent(id)}/read`),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.notifications });
    },
  });
}

/** Real endpoint — `PATCH /api/notifications/read-all` (returns 204, no body). */
export function useMarkAllReadMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => apiClient.patch<void>('/notifications/read-all'),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.notifications });
    },
  });
}
