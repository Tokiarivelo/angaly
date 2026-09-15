import type { PaymentMethod } from '@angaly/types';
import type { IPaymentProviderPort } from '../../domain/ports/payment-provider.port';
import { MockPaymentProviderAdapter } from './mock-payment-provider.adapter';

export const paymentProviderFactory = (_method: PaymentMethod): IPaymentProviderPort => {
  // In a real scenario, you would return specific adapters for Mobile Money, Card, etc.
  // We use a mock adapter for all methods to satisfy the interface for now.
  return new MockPaymentProviderAdapter();
};
