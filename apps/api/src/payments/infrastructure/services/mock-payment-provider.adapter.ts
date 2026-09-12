import { IPaymentProviderPort, PaymentInitializationResult } from '../../domain/ports/payment-provider.port';
import { randomUUID } from 'crypto';

export class MockPaymentProviderAdapter implements IPaymentProviderPort {
  async initiatePayment(_orderId: string, _amount: number): Promise<PaymentInitializationResult> {
    return {
      transactionRef: `mock-txn-${randomUUID().substring(0, 8)}`,
      requiresManualConfirmation: false,
    };
  }

  async confirmPayment(_transactionRef: string): Promise<boolean> {
    return true; // Auto success
  }

  async refund(_transactionRef: string, _amount: number): Promise<boolean> {
    return true; // Auto success
  }
}
