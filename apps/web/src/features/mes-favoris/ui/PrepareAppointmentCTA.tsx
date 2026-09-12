import { usePrepareAppointmentFromFavorites } from '../hooks/usePrepareAppointmentFromFavorites';
import type { FavoriteDto } from '@angaly/types';

interface PrepareAppointmentCTAProps {
  favorites: FavoriteDto[];
}

export const PrepareAppointmentCTA = ({ favorites }: PrepareAppointmentCTAProps) => {
  const prepareAppointment = usePrepareAppointmentFromFavorites(favorites);

  if (favorites.length === 0) return null;

  return (
    <div className="mt-16 border-t border-border pt-12 flex justify-center">
      <button
        onClick={prepareAppointment}
        className="inline-flex h-14 items-center justify-center bg-navy-deep px-8 font-medium text-white transition-colors hover:bg-navy-dark"
      >
        Préparer un rendez-vous avec mes favoris
      </button>
    </div>
  );
};
