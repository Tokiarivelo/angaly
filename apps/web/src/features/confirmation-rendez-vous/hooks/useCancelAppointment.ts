'use client';

import { useState } from 'react';

import { useCancelAppointmentMutation } from '../api/appointments.api';

export interface UseCancelAppointmentResult {
  isConfirming: boolean;
  requestCancel: () => void;
  dismissCancel: () => void;
  confirmCancel: () => void;
  isCancelling: boolean;
  isError: boolean;
}

/** "Annuler" — inline two-step confirm (no native browser dialog, per the design system's tone). */
export function useCancelAppointment(reference: string): UseCancelAppointmentResult {
  const [isConfirming, setIsConfirming] = useState(false);
  const mutation = useCancelAppointmentMutation(reference);

  return {
    isConfirming,
    requestCancel: () => setIsConfirming(true),
    dismissCancel: () => setIsConfirming(false),
    confirmCancel: () => {
      mutation.mutate(undefined, { onSuccess: () => setIsConfirming(false) });
    },
    isCancelling: mutation.isPending,
    isError: mutation.isError,
  };
}
