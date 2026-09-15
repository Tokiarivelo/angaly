import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PaymentMethod } from '@angaly/types';

import { CustomerEntity } from '../../../customers/domain/entities/customer.entity';
import type { ICustomerRepository } from '../../../customers/domain/repositories/customer.repository';
import type { PrismaService } from '../../../prisma/prisma.service';
import type { IPaymentProviderPort } from '../../domain/ports/payment-provider.port';
import type { IPaymentRepository } from '../../domain/repositories/payment.repository';
import { InitiatePaymentUseCase } from '../../application/use-cases/initiate-payment.use-case';

function sampleCustomer(id = 'customer-1', userId = 'user-1'): CustomerEntity {
  return CustomerEntity.create({ id, userId, firstName: 'Nirina', lastName: 'Rakoto', phone: null, createdAt: new Date(), updatedAt: new Date() });
}

function buildCustomerRepository(customer: CustomerEntity | null = sampleCustomer()): jest.Mocked<ICustomerRepository> {
  return { findByUserId: jest.fn().mockResolvedValue(customer), findById: jest.fn(), update: jest.fn() };
}

function buildPaymentRepository(): jest.Mocked<IPaymentRepository> {
  return { create: jest.fn(), findById: jest.fn(), findByOrderId: jest.fn(), update: jest.fn() };
}

function buildProvider(): jest.Mocked<IPaymentProviderPort> {
  return {
    initiatePayment: jest.fn().mockResolvedValue({ transactionRef: 'txn-123', requiresManualConfirmation: false }),
    confirmPayment: jest.fn(),
    refund: jest.fn(),
  };
}

function orderRecord(overrides: Partial<{ status: string; customerId: string; total: number }> = {}) {
  return {
    id: 'order-1',
    customerId: overrides.customerId ?? 'customer-1',
    status: overrides.status ?? 'PENDING',
    total: overrides.total ?? 50000,
  };
}

describe('InitiatePaymentUseCase', () => {
  it('throws NotFoundException when the order does not exist', async () => {
    const prisma = { order: { findUnique: jest.fn().mockResolvedValue(null) } } as unknown as PrismaService;
    const useCase = new InitiatePaymentUseCase(buildPaymentRepository(), () => buildProvider(), buildCustomerRepository(), prisma);

    await expect(useCase.execute({ userId: 'user-1', orderId: 'order-1', method: PaymentMethod.CARD })).rejects.toThrow(NotFoundException);
  });

  it('rejects initiating a payment for another customer’s order', async () => {
    const prisma = { order: { findUnique: jest.fn().mockResolvedValue(orderRecord({ customerId: 'customer-2' })) } } as unknown as PrismaService;
    const useCase = new InitiatePaymentUseCase(buildPaymentRepository(), () => buildProvider(), buildCustomerRepository(sampleCustomer('customer-1')), prisma);

    await expect(useCase.execute({ userId: 'user-1', orderId: 'order-1', method: PaymentMethod.CARD })).rejects.toThrow(ForbiddenException);
  });

  it('rejects initiating a payment for a non-PENDING order', async () => {
    const prisma = { order: { findUnique: jest.fn().mockResolvedValue(orderRecord({ status: 'PAID' })) } } as unknown as PrismaService;
    const useCase = new InitiatePaymentUseCase(buildPaymentRepository(), () => buildProvider(), buildCustomerRepository(), prisma);

    await expect(useCase.execute({ userId: 'user-1', orderId: 'order-1', method: PaymentMethod.CARD })).rejects.toThrow(BadRequestException);
  });

  it('creates a PENDING payment for the resolved provider transactionRef and order total', async () => {
    const prisma = { order: { findUnique: jest.fn().mockResolvedValue(orderRecord({ total: 75000 })) } } as unknown as PrismaService;
    const paymentRepository = buildPaymentRepository();
    const provider = buildProvider();
    const useCase = new InitiatePaymentUseCase(paymentRepository, () => provider, buildCustomerRepository(), prisma);

    const payment = await useCase.execute({ userId: 'user-1', orderId: 'order-1', method: PaymentMethod.MOBILE_MONEY });

    expect(payment.amount).toBe(75000);
    expect(payment.transactionRef).toBe('txn-123');
    expect(provider.initiatePayment).toHaveBeenCalledWith('order-1', 75000);
    expect(paymentRepository.create).toHaveBeenCalledWith(payment);
  });
});
