import { useState } from 'react';

export type CheckoutStep = 'expedition' | 'paiement' | 'confirmation';

export interface CheckoutState {
  step: CheckoutStep;
  orderId: string | null;
  setStep: (step: CheckoutStep) => void;
  setOrderId: (orderId: string) => void;
}

export function useCheckoutWizard(): CheckoutState {
  const [step, setStep] = useState<CheckoutStep>('expedition');
  const [orderId, setOrderId] = useState<string | null>(null);

  return {
    step,
    setStep,
    orderId,
    setOrderId,
  };
}
