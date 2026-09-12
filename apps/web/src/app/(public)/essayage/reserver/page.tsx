import { Suspense } from 'react';
import { ReservationEssayagePage } from '@/features/reservation-essayage';

export default function Page() {
  return (
    <Suspense>
      <ReservationEssayagePage />
    </Suspense>
  );
}
