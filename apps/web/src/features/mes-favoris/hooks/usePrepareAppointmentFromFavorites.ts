import { useRouter } from 'next/navigation';
import { useCallback } from 'react';
import type { FavoriteDto } from '@angaly/types';

export const usePrepareAppointmentFromFavorites = (_favorites: FavoriteDto[]) => {
  const router = useRouter();

  const prepareAppointment = useCallback(() => {
    // Collect slugs or IDs from favorites. For now, we will pass them as query params or store in a state.
    // Given URL limits, a state is better, but query params are simple for now.
    // The easiest is just redirecting to /prendre-rendez-vous.
    router.push('/prendre-rendez-vous?from=favorites');
  }, [router]);

  return prepareAppointment;
};
