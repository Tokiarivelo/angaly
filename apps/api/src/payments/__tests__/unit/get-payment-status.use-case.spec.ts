import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { OrderStatus, PaymentMethod, PaymentStatus } from '@angaly/types';

import { CustomerEntity } from '../../../customers/domain/entities/customer.entity';
import type { ICustomerRepository } from '../../../customers/domain/repositories/customer.repository';
import { Order } from '../../../orders/domain/entities/order.entity';
import type { IOrderRepository } from '../../../orders/domain/repositories/order.repository';
import { Payment } from '../../domain/entities/payment.entity';
import type { IPaymentRepository } from '../../domain/repositories/payment.repository';
import { GetPaymentStatusUseCase } from '../../application/use-cases/get-payment-status.use-case';

function samplePayment(): Payment {
  return new Payment('payment-1', 'order-1', PaymentMethod.CARD, PaymentStatus.PAID, 1000, 'txn-1', new Date(), new Date());
}

function sampleOrder(customerId = 'customer-1'): Order {
  return new Order('order-1', 'ANG-2026-0001', customerId, OrderStatus.PAID, 1000, 0, 1000, 'MGA', null, new Date(), new Date(), []);
}

function buildPaymentRepository(payment: Payment | null): jest.Mocked<IPaymentRepository> {
  return { create: jest.fn(), findById: jest.fn().mockResolvedValue(payment), findByOrderId: jest.fn(), update: jest.fn(), findByCustomerId: jest.fn(), findAll: jest.fn() };
}

function buildOrderRepository(order: Order | null): jest.Mocked<IOrderRepository> {
  return { create: jest.fn(), findById: jest.fn().mockResolvedValue(order), findByOrderNumber: jest.fn(), findByCustomerId: jest.fn(), findAll: jest.fn(), update: jest.fn() };
}

function buildCustomerRepository(customerId = 'customer-1'): jest.Mocked<ICustomerRepository> {
  const customer = CustomerEntity.create({ id: customerId, userId: 'user-1', firstName: 'Nirina', lastName: 'Rakoto', phone: null, createdAt: new Date(), updatedAt: new Date() });
  return { findByUserId: jest.fn().mockResolvedValue(customer), findById: jest.fn(), update: jest.fn() };
}

describe('GetPaymentStatusUseCase', () => {
  it('throws NotFoundException for an unknown payment', async () => {
    const useCase = new GetPaymentStatusUseCase(buildPaymentRepository(null), buildOrderRepository(null), buildCustomerRepository());

    await expect(useCase.execute('missing', 'user-1', 'CLIENT')).rejects.toThrow(NotFoundException);
  });

  it('returns the payment to the owner of its order', async () => {
    const useCase = new GetPaymentStatusUseCase(buildPaymentRepository(samplePayment()), buildOrderRepository(sampleOrder('customer-1')), buildCustomerRepository('customer-1'));

    const payment = await useCase.execute('payment-1', 'user-1', 'CLIENT');
    expect(payment.id).toBe('payment-1');
  });

  it('rejects a CLIENT reading a payment on another customer’s order', async () => {
    const useCase = new GetPaymentStatusUseCase(buildPaymentRepository(samplePayment()), buildOrderRepository(sampleOrder('customer-2')), buildCustomerRepository('customer-1'));

    await expect(useCase.execute('payment-1', 'user-1', 'CLIENT')).rejects.toThrow(ForbiddenException);
  });

  it('lets MANAGER read any payment without an ownership check', async () => {
    const orderRepository = buildOrderRepository(sampleOrder('customer-2'));
    const useCase = new GetPaymentStatusUseCase(buildPaymentRepository(samplePayment()), orderRepository, buildCustomerRepository('customer-1'));

    const payment = await useCase.execute('payment-1', 'staff-user', 'MANAGER');

    expect(payment.id).toBe('payment-1');
    expect(orderRepository.findById).not.toHaveBeenCalled();
  });
});
