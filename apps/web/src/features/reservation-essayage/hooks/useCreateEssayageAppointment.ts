'use client';

import { useRouter } from 'next/navigation';
import type { ProductDto } from '@angaly/types';

import { useCreateEssayageAppointmentMutation } from '../api/appointments.api';
import type { EssayageReservationValues } from '../schemas/essayage-reservation.schema';

export interface UseCreateEssayageAppointmentResult {
  submit: (values: EssayageReservationValues, product: ProductDto | null) => void;
  isSubmitting: boolean;
  isError: boolean;
}

/**
 * Creates the `ESSAYAGE` appointment then redirects to its confirmation page. `Appointment`
 * has no `productId`/`productVariantId` column (see docs/pages/reservation-essayage.md
 * "Points d'attention") — the product/size context is encoded into the free-text `message`
 * field instead, never a schema workaround invented client-side.
 */
export function useCreateEssayageAppointment(): UseCreateEssayageAppointmentResult {
  const router = useRouter();
  const mutation = useCreateEssayageAppointmentMutation();

  const submit = (values: EssayageReservationValues, product: ProductDto | null) => {
    const productContext = product ? `${product.name} — Taille ${values.size} — Réf. ${product.sku}` : `Taille ${values.size}`;

    mutation.mutate(
      {
        firstName: values.firstName,
        lastName: values.lastName,
        phone: values.phone,
        email: values.email,
        atelierId: values.atelierId,
        scheduledAt: values.scheduledAt,
        message: productContext,
      },
      {
        onSuccess: (appointment) => {
          router.push(`/rendez-vous/${appointment.reference}/confirmation`);
        },
      },
    );
  };

  return { submit, isSubmitting: mutation.isPending, isError: mutation.isError };
}
