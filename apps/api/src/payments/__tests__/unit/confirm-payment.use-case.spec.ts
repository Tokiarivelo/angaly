import { BadRequestException, NotFoundException } from '@nestjs/common';
import { OrderStatus, PaymentMethod, PaymentStatus } from '@angaly/types';

import { Order } from '../../../orders/domain/entities/order.entity';
import type { IOrderRepository } from '../../../orders/domain/repositories/order.repository';
import type { PrismaService } from '../../../prisma/prisma.service';
import { Payment } from '../../domain/entities/payment.entity';
import type { IPaymentRepository } from '../../domain/repositories/payment.repository';
import { ConfirmPaymentUseCase } from '../../application/use-cases/confirm-payment.use-case';

function samplePayment(status: PaymentStatus = PaymentStatus.PENDING): Payment {
  return new Payment('payment-1', 'order-1', PaymentMethod.CASH_ON_DELIVERY, status, 1000, 'txn-1', null, new Date());
}

function sampleOrder(status: OrderStatus): Order {
  return new Order('order-1', 'ANG-2026-0001', 'customer-1', status, 1000, 0, 1000, 'MGA', null, new Date(), new Date(), []);
}

function buildPaymentRepository(payment: Payment | null): jest.Mocked<IPaymentRepository> {
  return { create: jest.fn(), findById: jest.fn().mockResolvedValue(payment), findByOrderId: jest.fn(), update: jest.fn() };
}

function buildOrderRepository(order: Order | null): jest.Mocked<IOrderRepository> {
  return { create: jest.fn(), findById: jest.fn().mockResolvedValue(order), findByOrderNumber: jest.fn(), findByCustomerId: jest.fn(), findAll: jest.fn(), update: jest.fn() };
}

interface MockTx {
  payment: { update: jest.Mock };
  order: { update: jest.Mock };
}

function buildPrismaServiceMock(): { prisma: PrismaService; tx: MockTx } {
  const tx: MockTx = { payment: { update: jest.fn() }, order: { update: jest.fn() } };
  const prisma = { $transaction: jest.fn((fn: (tx: MockTx) => unknown) => fn(tx)) } as unknown as PrismaService;
  return { prisma, tx };
}

describe('ConfirmPaymentUseCase', () => {
  it('throws NotFoundException when the payment does not exist', async () => {
    const { prisma } = buildPrismaServiceMock();
    const useCase = new ConfirmPaymentUseCase(buildPaymentRepository(null), buildOrderRepository(null), prisma);

    await expect(useCase.execute({ paymentId: 'missing' })).rejects.toThrow(NotFoundException);
  });

  it('throws NotFoundException when the associated order does not exist', async () => {
    const { prisma } = buildPrismaServiceMock();
    const useCase = new ConfirmPaymentUseCase(buildPaymentRepository(samplePayment()), buildOrderRepository(null), prisma);

    await expect(useCase.execute({ paymentId: 'payment-1' })).rejects.toThrow(NotFoundException);
  });

  it('rejects confirming a payment whose order is not CONFIRMED, without writing anything', async () => {
    const { prisma, tx } = buildPrismaServiceMock();
    const useCase = new ConfirmPaymentUseCase(
      buildPaymentRepository(samplePayment()),
      buildOrderRepository(sampleOrder(OrderStatus.CANCELLED)),
      prisma,
    );

    await expect(useCase.execute({ paymentId: 'payment-1' })).rejects.toThrow(BadRequestException);
    expect(tx.payment.update).not.toHaveBeenCalled();
    expect(tx.order.update).not.toHaveBeenCalled();
  });

  it('confirms the payment and transitions the order to PAID atomically', async () => {
    const { prisma, tx } = buildPrismaServiceMock();
    const useCase = new ConfirmPaymentUseCase(
      buildPaymentRepository(samplePayment(PaymentStatus.PENDING)),
      buildOrderRepository(sampleOrder(OrderStatus.CONFIRMED)),
      prisma,
    );

    await useCase.execute({ paymentId: 'payment-1', transactionRef: 'txn-final' });

    expect(tx.payment.update).toHaveBeenCalledWith({
      where: { id: 'payment-1' },
      data: expect.objectContaining({ status: PaymentStatus.PAID, transactionRef: 'txn-final' }),
    });
    expect(tx.order.update).toHaveBeenCalledWith({ where: { id: 'order-1' }, data: { status: OrderStatus.PAID } });
  });
});
