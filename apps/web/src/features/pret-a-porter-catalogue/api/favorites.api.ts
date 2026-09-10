'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { FavoriteEntityType, type FavoriteDto } from '@angaly/types';

import { apiClient } from '@/lib/api-client';

import { QUERY_KEYS } from '../consts/queryKeys';

const FAVORITES_QUERY_KEY = [...QUERY_KEYS.all, 'favorites'];

/** Real endpoint — see docs/features/customers.md. Only fetched for a signed-in visitor. */
export function useFavoritesQuery() {
  const { status } = useSession();
  return useQuery({
    queryKey: FAVORITES_QUERY_KEY,
    queryFn: () => apiClient.get<FavoriteDto[]>('/favorites'),
    enabled: status === 'authenticated',
  });
}

export function useAddFavoriteMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (entityId: string) =>
      apiClient.post<FavoriteDto>('/favorites', { entityType: FavoriteEntityType.PRODUCT, entityId }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: FAVORITES_QUERY_KEY });
    },
  });
}

export function useRemoveFavoriteMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (favoriteId: string) => apiClient.delete<void>(`/favorites/${favoriteId}`),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: FAVORITES_QUERY_KEY });
    },
  });
}
