'use client';

import { useSearchParams } from 'next/navigation';
import { useFavorites } from '../hooks/useFavorites';
import { FavoriteTypeFilterTabs } from './FavoriteTypeFilterTabs';
import { FavoritesGrid } from './FavoritesGrid';
import { PrepareAppointmentCTA } from './PrepareAppointmentCTA';

export const MesFavorisPage = () => {
  const searchParams = useSearchParams();
  const currentType = searchParams.get('type') ?? 'ALL';
  const { data: favorites = [], isLoading } = useFavorites(currentType);

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="mb-8 font-serif text-4xl text-navy-deep">Mes favoris</h1>
      
      <FavoriteTypeFilterTabs currentType={currentType} />
      
      <FavoritesGrid favorites={favorites} isLoading={isLoading} />
      
      {!isLoading && <PrepareAppointmentCTA favorites={favorites} />}
    </div>
  );
};
