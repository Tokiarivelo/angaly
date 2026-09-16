'use client';

import { useSession } from 'next-auth/react';
import { useState } from 'react';
import type { OrderDto, PaymentDto, PaymentMethod } from '@angaly/types';

import { useCartStore } from '@/stores/cart.store';

import { useCreateOrderMutation } from '../api/orders.api';
import { useInitiatePaymentMutation } from '../api/payments.api';

export type CheckoutStep = 'expedition' | 'paiement' | 'confirmation';

export interface ShippingAddressInput {
  prenom: string;
  nom: string;
  email: string;
  telephone: string;
  adresse: string;
  ville: string;
  region: string;
  method: 'domicile' | 'atelier';
}

export interface CheckoutState {
  step: CheckoutStep;
  setStep: (step: CheckoutStep) => void;
  /** Guest checkout is not implemented — `POST /api/orders`/`POST /api/payments` require an authenticated CLIENT (see docs/pages/checkout.md "Points d'attention"). */
  isAuthenticated: boolean;
  order: OrderDto | null;
  payment: PaymentDto | null;
  createOrder: (address: ShippingAddressInput) => Promise<OrderDto | null>;
  isCreatingOrder: boolean;
  createOrderError: string | null;
  submitPayment: (method: PaymentMethod) => Promise<PaymentDto | null>;
  isSubmittingPayment: boolean;
  submitPaymentError: string | null;
}

/**
 * All wizard state (current step, created order/payment, mutation status)
 * lives here — `CheckoutWizard.tsx` and each `steps/*Step.tsx` only read this
 * hook's output (JSX + hooks only, per CLAUDE.md règle #8).
 */
export function useCheckoutWizard(): CheckoutState {
  const [step, setStep] = useState<CheckoutStep>('expedition');
  const [order, setOrder] = useState<OrderDto | null>(null);
  const [payment, setPayment] = useState<PaymentDto | null>(null);

  const { status } = useSession();
  const { items, clear } = useCartStore();

  const createOrderMutation = useCreateOrderMutation();
  const initiatePaymentMutation = useInitiatePaymentMutation();

  const createOrder = async (address: ShippingAddressInput): Promise<OrderDto | null> => {
    const created = await createOrderMutation.mutateAsync({
      items: items.map((item) => ({ productVariantId: item.variantId, quantity: item.quantity })),
      shippingAddressJson: address,
    });
    setOrder(created);
    setStep('paiement');
    return created;
  };

  const submitPayment = async (method: PaymentMethod): Promise<PaymentDto | null> => {
    if (!order) return null;
    const created = await initiatePaymentMutation.mutateAsync({ orderId: order.id, method });
    setPayment(created);
    // Cart is only cleared once the order is safely materialized server-side.
    clear();
    setStep('confirmation');
    return created;
  };

  return {
    step,
    setStep,
    isAuthenticated: status === 'authenticated',
    order,
    payment,
    createOrder,
    isCreatingOrder: createOrderMutation.isPending,
    createOrderError: createOrderMutation.error?.message ?? null,
    submitPayment,
    isSubmittingPayment: initiatePaymentMutation.isPending,
    submitPaymentError: initiatePaymentMutation.error?.message ?? null,
  };
}
