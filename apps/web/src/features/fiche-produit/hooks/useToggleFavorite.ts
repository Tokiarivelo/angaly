'use client';

import { useSession } from 'next-auth/react';
import { usePathname, useRouter } from 'next/navigation';
import { useMemo } from 'react';

import { REDIRECT_TO_PARAM } from '@/features/authentification/consts/queryKeys';
import { ROUTES } from '@/lib/routes';

import { useAddFavoriteMutation, useFavoritesQuery, useRemoveFavoriteMutation } from '../api/favorites.api';

/** Same auth-gated pattern as pret-a-porter-catalogue's useToggleFavorite.ts (feature-isolated, not shared). */
export function useToggleFavorite(): {
  isFavorite: (productId: string) => boolean;
  toggleFavorite: (productId: string) => void;
  isPending: boolean;
} {
  const { status } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  const favoritesQuery = useFavoritesQuery();
  const addFavorite = useAddFavoriteMutation();
  const removeFavorite = useRemoveFavoriteMutation();

  const favoriteIdByProductId = useMemo(() => {
    const map = new Map<string, string>();
    for (const favorite of favoritesQuery.data ?? []) {
      map.set(favorite.entityId, favorite.id);
    }
    return map;
  }, [favoritesQuery.data]);

  return {
    isFavorite: (productId: string) => favoriteIdByProductId.has(productId),
    toggleFavorite: (productId: string) => {
      if (status !== 'authenticated') {
        router.push(`${ROUTES.connexion}?${REDIRECT_TO_PARAM}=${encodeURIComponent(pathname)}`);
        return;
      }

      const existingFavoriteId = favoriteIdByProductId.get(productId);
      if (existingFavoriteId) {
        removeFavorite.mutate(existingFavoriteId);
      } else {
        addFavorite.mutate(productId);
      }
    },
    isPending: addFavorite.isPending || removeFavorite.isPending,
  };
}
