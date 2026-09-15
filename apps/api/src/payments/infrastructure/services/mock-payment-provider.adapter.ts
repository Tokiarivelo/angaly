import type { IPaymentProviderPort, PaymentInitializationResult } from '../../domain/ports/payment-provider.port';
import { randomUUID } from 'crypto';

export class MockPaymentProviderAdapter implements IPaymentProviderPort {
  initiatePayment(_orderId: string, _amount: number): Promise<PaymentInitializationResult> {
    return Promise.resolve({
      transactionRef: `mock-txn-${randomUUID().substring(0, 8)}`,
      requiresManualConfirmation: false,
    });
  }

  confirmPayment(_transactionRef: string): Promise<boolean> {
    return Promise.resolve(true); // Auto success
  }

  refund(_transactionRef: string, _amount: number): Promise<boolean> {
    return Promise.resolve(true); // Auto success
  }
}
