import type { FavoriteDto } from '@angaly/types';
import { FavoriteCard } from './FavoriteCard';
import { EmptyFavoritesState } from './EmptyFavoritesState';

interface FavoritesGridProps {
  favorites: FavoriteDto[];
  isLoading: boolean;
}

export const FavoritesGrid = ({ favorites, isLoading }: FavoritesGridProps) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3 lg:grid-cols-4 lg:gap-x-8 lg:gap-y-12">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="aspect-[2/3] w-full bg-ivory-warm"></div>
            <div className="mt-4 h-3 w-16 bg-ivory-warm"></div>
            <div className="mt-2 h-5 w-3/4 bg-ivory-warm"></div>
          </div>
        ))}
      </div>
    );
  }

  if (favorites.length === 0) {
    return <EmptyFavoritesState />;
  }

  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3 lg:grid-cols-4 lg:gap-x-8 lg:gap-y-12">
      {favorites.map((favorite) => (
        <FavoriteCard key={favorite.id} favorite={favorite} />
      ))}
    </div>
  );
};
