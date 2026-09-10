'use client';

import { useSession } from 'next-auth/react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useMemo } from 'react';

import { REDIRECT_TO_PARAM } from '@/features/authentification/consts/queryKeys';
import { ROUTES } from '@/lib/routes';

import { useAddFavoriteMutation, useFavoritesQuery, useRemoveFavoriteMutation } from '../api/favorites.api';

/**
 * A signed-out visitor is redirected to /connexion (with `redirectTo` back
 * here) instead of the mutation ever firing — see docs/pages/pret-a-porter-
 * catalogue.md "Points d'attention" ("seul le bouton favori déclenche une
 * invite à se connecter").
 */
export function useToggleFavorite(): {
  isFavorite: (productId: string) => boolean;
  toggleFavorite: (productId: string) => void;
  isPending: boolean;
} {
  const { status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

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
        const redirectTo = `${pathname}${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
        router.push(`${ROUTES.connexion}?${REDIRECT_TO_PARAM}=${encodeURIComponent(redirectTo)}`);
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
