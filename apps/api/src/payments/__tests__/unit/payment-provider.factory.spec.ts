import { PaymentMethod } from '@angaly/types';

import { MockPaymentProviderAdapter } from '../../infrastructure/services/mock-payment-provider.adapter';
import { paymentProviderFactory } from '../../infrastructure/services/payment-provider.factory';

describe('paymentProviderFactory', () => {
  it.each([PaymentMethod.MOBILE_MONEY, PaymentMethod.CARD, PaymentMethod.BANK_TRANSFER, PaymentMethod.CASH_ON_DELIVERY])(
    'resolves a provider for %s (currently the shared mock adapter — see docs/features/payments.md)',
    (method) => {
      expect(paymentProviderFactory(method)).toBeInstanceOf(MockPaymentProviderAdapter);
    },
  );
});
