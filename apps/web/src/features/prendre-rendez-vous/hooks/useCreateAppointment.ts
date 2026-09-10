'use client';

import { useRouter } from 'next/navigation';

import { useCreateAppointmentMutation } from '../api/appointments.api';
import type { AppointmentFormValues } from '../schemas/appointment.schema';

export interface UseCreateAppointmentResult {
  submit: (values: AppointmentFormValues) => void;
  isSubmitting: boolean;
  isError: boolean;
}

/** Creates the appointment then redirects to its confirmation page (see docs/pages/confirmation-rendez-vous.md). */
export function useCreateAppointment(): UseCreateAppointmentResult {
  const router = useRouter();
  const mutation = useCreateAppointmentMutation();

  const submit = (values: AppointmentFormValues) => {
    mutation.mutate(
      {
        firstName: values.firstName,
        lastName: values.lastName,
        phone: values.phone,
        email: values.email,
        type: values.type,
        atelierId: values.atelierId,
        scheduledAt: values.scheduledAt,
        message: values.message?.trim() ? values.message.trim() : null,
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
