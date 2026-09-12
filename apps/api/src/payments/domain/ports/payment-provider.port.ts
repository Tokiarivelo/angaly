export const PAYMENT_PROVIDER_FACTORY_TOKEN = Symbol('PAYMENT_PROVIDER_FACTORY_TOKEN');

export interface PaymentInitializationResult {
  transactionRef: string;
  redirectUrl?: string; // used for some mobile money/card flows
  requiresManualConfirmation: boolean;
}

export interface IPaymentProviderPort {
  initiatePayment(orderId: string, amount: number): Promise<PaymentInitializationResult>;
  confirmPayment(transactionRef: string): Promise<boolean>;
  refund(transactionRef: string, amount: number): Promise<boolean>;
}
