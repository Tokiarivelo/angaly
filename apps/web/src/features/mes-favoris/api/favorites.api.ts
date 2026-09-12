import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { apiClient } from '@/lib/api-client';
import type { FavoriteDto } from '@angaly/types';
import { FAVORITES_QUERY_KEYS } from '../consts/query-keys.const';

export const useFavoritesQuery = (type?: string) => {
  return useQuery({
    queryKey: FAVORITES_QUERY_KEYS.list(type),
    queryFn: async () => {
      const qs = type && type !== 'ALL' ? `?type=${type}` : '';
      const data = await apiClient.get<FavoriteDto[]>(`/api/favorites${qs}`);
      return data;
    },
  });
};

export const useRemoveFavoriteMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/api/favorites/${id}`);
    },
    onMutate: async (deletedId) => {
      await queryClient.cancelQueries({ queryKey: FAVORITES_QUERY_KEYS.lists() });

      const previousFavorites = queryClient.getQueriesData<FavoriteDto[]>({
        queryKey: FAVORITES_QUERY_KEYS.lists(),
      });

      queryClient.setQueriesData<FavoriteDto[]>(
        { queryKey: FAVORITES_QUERY_KEYS.lists() },
        (old) => (old ? old.filter((favorite) => favorite.id !== deletedId) : [])
      );

      return { previousFavorites };
    },
    onError: (_err, _deletedId, context) => {
      if (context?.previousFavorites) {
        context.previousFavorites.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: FAVORITES_QUERY_KEYS.lists() });
    },
  });
};
