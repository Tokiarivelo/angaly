import { PaymentMethod, PaymentStatus } from '@angaly/types';

import type { PrismaService } from '../../../prisma/prisma.service';
import { Payment } from '../../domain/entities/payment.entity';
import { PrismaPaymentRepository } from '../../infrastructure/repositories/prisma-payment.repository';

interface MockPaymentDelegate {
  create: jest.Mock;
  findUnique: jest.Mock;
  findMany: jest.Mock;
  update: jest.Mock;
}

function buildPrismaServiceMock(): { prisma: PrismaService; payment: MockPaymentDelegate } {
  const payment: MockPaymentDelegate = { create: jest.fn(), findUnique: jest.fn(), findMany: jest.fn(), update: jest.fn() };
  const prisma = { payment } as unknown as PrismaService;
  return { prisma, payment };
}

function paymentRecord() {
  return {
    id: 'payment-1',
    orderId: 'order-1',
    method: PaymentMethod.CARD,
    status: PaymentStatus.PENDING,
    amount: 1000 as unknown,
    transactionRef: 'txn-1',
    paidAt: null,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
  };
}

describe('PrismaPaymentRepository', () => {
  it('create() writes every field', async () => {
    const { prisma, payment } = buildPrismaServiceMock();
    const domainPayment = new Payment('payment-1', 'order-1', PaymentMethod.CARD, PaymentStatus.PENDING, 1000, 'txn-1', null, new Date());

    await new PrismaPaymentRepository(prisma).create(domainPayment);

    expect(payment.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ id: 'payment-1', orderId: 'order-1' }) }));
  });

  it('findById() returns null when no row matches', async () => {
    const { prisma, payment } = buildPrismaServiceMock();
    payment.findUnique.mockResolvedValue(null);

    expect(await new PrismaPaymentRepository(prisma).findById('missing')).toBeNull();
  });

  it('findById() maps a found row to a domain entity', async () => {
    const { prisma, payment } = buildPrismaServiceMock();
    payment.findUnique.mockResolvedValue(paymentRecord());

    const result = await new PrismaPaymentRepository(prisma).findById('payment-1');
    expect(result?.id).toBe('payment-1');
    expect(result?.amount).toBe(1000);
  });

  it('findByOrderId() maps every row for an order', async () => {
    const { prisma, payment } = buildPrismaServiceMock();
    payment.findMany.mockResolvedValue([paymentRecord()]);

    const result = await new PrismaPaymentRepository(prisma).findByOrderId('order-1');
    expect(result).toHaveLength(1);
    expect(payment.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { orderId: 'order-1' } }));
  });

  it('findByCustomerId() filters by the order owner, most recent first', async () => {
    const { prisma, payment } = buildPrismaServiceMock();
    payment.findMany.mockResolvedValue([paymentRecord()]);

    const result = await new PrismaPaymentRepository(prisma).findByCustomerId('customer-1');

    expect(payment.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { order: { customerId: 'customer-1' } }, orderBy: { createdAt: 'desc' } }),
    );
    expect(result).toHaveLength(1);
  });

  it('findAll() returns every payment, most recent first', async () => {
    const { prisma, payment } = buildPrismaServiceMock();
    payment.findMany.mockResolvedValue([paymentRecord(), paymentRecord()]);

    const result = await new PrismaPaymentRepository(prisma).findAll();

    expect(payment.findMany).toHaveBeenCalledWith(expect.objectContaining({ orderBy: { createdAt: 'desc' } }));
    expect(result).toHaveLength(2);
  });

  it('update() persists status/transactionRef/paidAt', async () => {
    const { prisma, payment } = buildPrismaServiceMock();
    const domainPayment = new Payment('payment-1', 'order-1', PaymentMethod.CARD, PaymentStatus.PAID, 1000, 'txn-1', new Date('2026-01-02T00:00:00.000Z'), new Date());

    await new PrismaPaymentRepository(prisma).update(domainPayment);

    expect(payment.update).toHaveBeenCalledWith({
      where: { id: 'payment-1' },
      data: { status: PaymentStatus.PAID, transactionRef: 'txn-1', paidAt: domainPayment.paidAt },
    });
  });
});
