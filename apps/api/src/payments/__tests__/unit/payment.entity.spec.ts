import { PaymentMethod, PaymentStatus } from '@angaly/types';

import { Payment } from '../../domain/entities/payment.entity';

function buildPayment(status: PaymentStatus = PaymentStatus.PENDING): Payment {
  return new Payment('payment-1', 'order-1', PaymentMethod.CASH_ON_DELIVERY, status, 1000, 'txn-1', null, new Date());
}

describe('Payment', () => {
  it('rejects a zero amount', () => {
    expect(() => new Payment('p', 'o', PaymentMethod.CARD, PaymentStatus.PENDING, 0, null, null, new Date())).toThrow(
      'Payment amount must be greater than zero',
    );
  });

  it('rejects a negative amount', () => {
    expect(() => new Payment('p', 'o', PaymentMethod.CARD, PaymentStatus.PENDING, -1, null, null, new Date())).toThrow(
      'Payment amount must be greater than zero',
    );
  });

  describe('confirm', () => {
    it('transitions PENDING -> PAID and sets paidAt', () => {
      const payment = buildPayment(PaymentStatus.PENDING);
      payment.confirm();
      expect(payment.status).toBe(PaymentStatus.PAID);
      expect(payment.paidAt).toBeInstanceOf(Date);
    });

    it('transitions AUTHORIZED -> PAID', () => {
      const payment = buildPayment(PaymentStatus.AUTHORIZED);
      payment.confirm();
      expect(payment.status).toBe(PaymentStatus.PAID);
    });

    it('overwrites transactionRef when one is provided', () => {
      const payment = buildPayment(PaymentStatus.PENDING);
      payment.confirm('new-ref');
      expect(payment.transactionRef).toBe('new-ref');
    });

    it('keeps the existing transactionRef when none is provided', () => {
      const payment = buildPayment(PaymentStatus.PENDING);
      payment.confirm();
      expect(payment.transactionRef).toBe('txn-1');
    });

    it('rejects confirming an already-PAID payment', () => {
      const payment = buildPayment(PaymentStatus.PAID);
      expect(() => payment.confirm()).toThrow('Cannot confirm payment from status PAID');
    });

    it('rejects confirming a FAILED payment', () => {
      const payment = buildPayment(PaymentStatus.FAILED);
      expect(() => payment.confirm()).toThrow(/Cannot confirm payment/);
    });
  });

  describe('fail', () => {
    it('transitions to FAILED', () => {
      const payment = buildPayment(PaymentStatus.PENDING);
      payment.fail();
      expect(payment.status).toBe(PaymentStatus.FAILED);
    });
  });

  describe('refund', () => {
    it('transitions PAID -> REFUNDED', () => {
      const payment = buildPayment(PaymentStatus.PAID);
      payment.refund();
      expect(payment.status).toBe(PaymentStatus.REFUNDED);
    });

    it('rejects refunding a non-PAID payment', () => {
      const payment = buildPayment(PaymentStatus.PENDING);
      expect(() => payment.refund()).toThrow('Cannot refund a payment that is not PAID');
    });
  });
});
