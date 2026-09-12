import Image from 'next/image';
import Link from 'next/link';
import type { FavoriteDto } from '@angaly/types';
import { useRemoveFavorite } from '../hooks/useRemoveFavorite';
import { FavoriteEntityType } from '@angaly/types';

interface FavoriteCardProps {
  favorite: FavoriteDto;
}

export const FavoriteCard = ({ favorite }: FavoriteCardProps) => {
  const { mutate: removeFavorite, isPending } = useRemoveFavorite();

  const getHref = () => {
    if (!favorite.display) return '#';
    switch (favorite.entityType) {
      case FavoriteEntityType.CREATION:
        return `/creations/${favorite.display.slug}`;
      case FavoriteEntityType.PRODUCT:
        return `/pret-a-porter/${favorite.display.slug}`;
      case FavoriteEntityType.COLLECTION:
        return `/collections/${favorite.display.slug}`;
      default:
        return '#';
    }
  };

  const getTypeLabel = () => {
    switch (favorite.entityType) {
      case FavoriteEntityType.CREATION:
        return 'Création';
      case FavoriteEntityType.PRODUCT:
        return 'Produit';
      case FavoriteEntityType.COLLECTION:
        return 'Collection';
      default:
        return '';
    }
  };

  if (!favorite.display) return null;

  return (
    <div className="group relative flex flex-col">
      <Link href={getHref()} className="relative block aspect-[2/3] w-full overflow-hidden bg-ivory-warm">
        {favorite.display.imageUrl ? (
          <Image
            src={favorite.display.imageUrl}
            alt={favorite.display.name}
            fill
            className="object-cover transition-transform duration-700 group-hover:scale-105"
            sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-ivory-warm">
            <span className="font-serif text-navy-soft/30">ANGALY</span>
          </div>
        )}
      </Link>
      
      <button
        onClick={(e) => {
          e.preventDefault();
          removeFavorite(favorite.id);
        }}
        disabled={isPending}
        className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-navy-deep shadow-sm transition-transform hover:scale-110 disabled:opacity-50"
        aria-label="Retirer des favoris"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="currentColor"
          className="h-6 w-6 text-gold-antique"
        >
          <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
        </svg>
      </button>

      <div className="mt-4 flex flex-col items-start gap-1">
        <span className="text-xs uppercase tracking-wider text-gray-warm">
          {getTypeLabel()}
        </span>
        <h3 className="font-serif text-lg text-navy-deep">
          <Link href={getHref()} className="hover:underline">
            {favorite.display.name}
          </Link>
        </h3>
      </div>
    </div>
  );
};
