import { PaymentMethod, PaymentStatus } from '@angaly/types';

import { Payment } from '../../domain/entities/payment.entity';
import { PaymentMapper } from '../../infrastructure/mappers/payment.mapper';

describe('PaymentMapper', () => {
  it('formats the amount as a fixed 2-decimal string and dates as ISO strings', () => {
    const payment = new Payment(
      'payment-1',
      'order-1',
      PaymentMethod.MOBILE_MONEY,
      PaymentStatus.PAID,
      45000,
      'txn-1',
      new Date('2026-01-02T00:00:00.000Z'),
      new Date('2026-01-01T00:00:00.000Z'),
    );

    const dto = PaymentMapper.toResponseDto(payment);

    expect(dto.amount).toBe('45000.00');
    expect(dto.paidAt).toBe('2026-01-02T00:00:00.000Z');
    expect(dto.createdAt).toBe('2026-01-01T00:00:00.000Z');
    expect(dto.transactionRef).toBe('txn-1');
  });

  it('leaves paidAt null for an unconfirmed payment', () => {
    const payment = new Payment('payment-1', 'order-1', PaymentMethod.CARD, PaymentStatus.PENDING, 1000, null, null, new Date('2026-01-01T00:00:00.000Z'));

    const dto = PaymentMapper.toResponseDto(payment);

    expect(dto.paidAt).toBeNull();
    expect(dto.transactionRef).toBeNull();
  });
});
