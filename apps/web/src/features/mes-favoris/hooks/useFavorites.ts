import { useFavoritesQuery } from '../api/favorites.api';

export const useFavorites = (type?: string) => {
  return useFavoritesQuery(type);
};
