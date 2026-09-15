import { BadRequestException, NotFoundException } from '@nestjs/common';
import { OrderStatus, PaymentMethod, PaymentStatus } from '@angaly/types';

import { Order } from '../../../orders/domain/entities/order.entity';
import type { IOrderRepository } from '../../../orders/domain/repositories/order.repository';
import type { PrismaService } from '../../../prisma/prisma.service';
import { Payment } from '../../domain/entities/payment.entity';
import type { IPaymentProviderPort } from '../../domain/ports/payment-provider.port';
import type { IPaymentRepository } from '../../domain/repositories/payment.repository';
import { RefundPaymentUseCase } from '../../application/use-cases/refund-payment.use-case';

function samplePayment(status: PaymentStatus, transactionRef: string | null = 'txn-1'): Payment {
  return new Payment('payment-1', 'order-1', PaymentMethod.CARD, status, 1000, transactionRef, status === PaymentStatus.PAID ? new Date() : null, new Date());
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

function buildProvider(): jest.Mocked<IPaymentProviderPort> {
  return { initiatePayment: jest.fn(), confirmPayment: jest.fn(), refund: jest.fn().mockResolvedValue(true) };
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

describe('RefundPaymentUseCase', () => {
  it('throws NotFoundException for an unknown payment', async () => {
    const { prisma } = buildPrismaServiceMock();
    const useCase = new RefundPaymentUseCase(buildPaymentRepository(null), buildOrderRepository(null), () => buildProvider(), prisma);

    await expect(useCase.execute('missing')).rejects.toThrow(NotFoundException);
  });

  it('rejects refunding an order that is not PAID/DELIVERED, without calling the provider', async () => {
    const { prisma } = buildPrismaServiceMock();
    const provider = buildProvider();
    const useCase = new RefundPaymentUseCase(
      buildPaymentRepository(samplePayment(PaymentStatus.PAID)),
      buildOrderRepository(sampleOrder(OrderStatus.PENDING)),
      () => provider,
      prisma,
    );

    await expect(useCase.execute('payment-1')).rejects.toThrow(BadRequestException);
    expect(provider.refund).not.toHaveBeenCalled();
  });

  it('rejects refunding a payment that is not PAID', async () => {
    const { prisma } = buildPrismaServiceMock();
    const useCase = new RefundPaymentUseCase(
      buildPaymentRepository(samplePayment(PaymentStatus.PENDING)),
      buildOrderRepository(sampleOrder(OrderStatus.PAID)),
      () => buildProvider(),
      prisma,
    );

    await expect(useCase.execute('payment-1')).rejects.toThrow(BadRequestException);
  });

  it('refunds via the provider and transitions payment + order atomically', async () => {
    const { prisma, tx } = buildPrismaServiceMock();
    const provider = buildProvider();
    const useCase = new RefundPaymentUseCase(
      buildPaymentRepository(samplePayment(PaymentStatus.PAID)),
      buildOrderRepository(sampleOrder(OrderStatus.PAID)),
      () => provider,
      prisma,
    );

    const payment = await useCase.execute('payment-1');

    expect(payment.status).toBe(PaymentStatus.REFUNDED);
    expect(provider.refund).toHaveBeenCalledWith('txn-1', 1000);
    expect(tx.payment.update).toHaveBeenCalledWith({ where: { id: 'payment-1' }, data: { status: PaymentStatus.REFUNDED } });
    expect(tx.order.update).toHaveBeenCalledWith({ where: { id: 'order-1' }, data: { status: OrderStatus.REFUNDED } });
  });

  it('refunds a DELIVERED order too', async () => {
    const { prisma } = buildPrismaServiceMock();
    const useCase = new RefundPaymentUseCase(
      buildPaymentRepository(samplePayment(PaymentStatus.PAID)),
      buildOrderRepository(sampleOrder(OrderStatus.DELIVERED)),
      () => buildProvider(),
      prisma,
    );

    const payment = await useCase.execute('payment-1');
    expect(payment.status).toBe(PaymentStatus.REFUNDED);
  });
});
