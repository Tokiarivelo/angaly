import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { OrderStatus } from '@angaly/types';

import { CustomerEntity } from '../../../customers/domain/entities/customer.entity';
import type { ICustomerRepository } from '../../../customers/domain/repositories/customer.repository';
import { Order } from '../../domain/entities/order.entity';
import type { IOrderRepository } from '../../domain/repositories/order.repository';
import { CancelOrderUseCase } from '../../application/use-cases/cancel-order.use-case';

function sampleOrder(status: OrderStatus, customerId = 'customer-1'): Order {
  return new Order('order-1', 'ANG-2026-0001', customerId, status, 100, 0, 100, 'MGA', null, new Date(), new Date(), []);
}

function buildOrderRepository(order: Order | null): jest.Mocked<IOrderRepository> {
  return {
    create: jest.fn(),
    findById: jest.fn().mockResolvedValue(order),
    findByOrderNumber: jest.fn(),
    findByCustomerId: jest.fn(),
    findAll: jest.fn(),
    update: jest.fn(),
  };
}

function buildCustomerRepository(customerId = 'customer-1'): jest.Mocked<ICustomerRepository> {
  const customer = CustomerEntity.create({
    id: customerId,
    userId: 'user-1',
    firstName: 'Nirina',
    lastName: 'Rakoto',
    phone: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  return { findByUserId: jest.fn().mockResolvedValue(customer), findById: jest.fn(), update: jest.fn() };
}

describe('CancelOrderUseCase', () => {
  it('throws NotFoundException for an unknown order', async () => {
    const useCase = new CancelOrderUseCase(buildOrderRepository(null), buildCustomerRepository());

    await expect(useCase.execute('missing', 'user-1')).rejects.toThrow(NotFoundException);
  });

  it('rejects cancelling another customer’s order', async () => {
    const useCase = new CancelOrderUseCase(
      buildOrderRepository(sampleOrder(OrderStatus.PENDING, 'customer-2')),
      buildCustomerRepository('customer-1'),
    );

    await expect(useCase.execute('order-1', 'user-1')).rejects.toThrow(ForbiddenException);
  });

  it('cancels a PENDING order owned by the caller', async () => {
    const orderRepository = buildOrderRepository(sampleOrder(OrderStatus.PENDING));
    const useCase = new CancelOrderUseCase(orderRepository, buildCustomerRepository());

    const order = await useCase.execute('order-1', 'user-1');

    expect(order.status).toBe(OrderStatus.CANCELLED);
    expect(orderRepository.update).toHaveBeenCalledWith(order);
  });

  it('cancels a CONFIRMED order owned by the caller', async () => {
    const useCase = new CancelOrderUseCase(buildOrderRepository(sampleOrder(OrderStatus.CONFIRMED)), buildCustomerRepository());

    const order = await useCase.execute('order-1', 'user-1');
    expect(order.status).toBe(OrderStatus.CANCELLED);
  });

  it('rejects cancelling an already-PAID order as a BadRequestException', async () => {
    const orderRepository = buildOrderRepository(sampleOrder(OrderStatus.PAID));
    const useCase = new CancelOrderUseCase(orderRepository, buildCustomerRepository());

    await expect(useCase.execute('order-1', 'user-1')).rejects.toThrow(BadRequestException);
    expect(orderRepository.update).not.toHaveBeenCalled();
  });
});
