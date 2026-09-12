import { useRemoveFavoriteMutation } from '../api/favorites.api';

export const useRemoveFavorite = () => {
  return useRemoveFavoriteMutation();
};
