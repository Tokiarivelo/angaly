import { useCancelAppointmentMutation } from '../api/appointments.api';

export const useCancelAppointment = () => {
  const mutation = useCancelAppointmentMutation();

  const cancel = async (reference: string) => {
    await mutation.mutateAsync(reference);
  };

  return { cancel, isCancelling: mutation.isPending, error: mutation.error?.message ?? null };
};
