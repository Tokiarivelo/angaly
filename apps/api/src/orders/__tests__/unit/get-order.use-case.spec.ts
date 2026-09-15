import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { OrderStatus } from '@angaly/types';

import { CustomerEntity } from '../../../customers/domain/entities/customer.entity';
import type { ICustomerRepository } from '../../../customers/domain/repositories/customer.repository';
import { Order } from '../../domain/entities/order.entity';
import type { IOrderRepository } from '../../domain/repositories/order.repository';
import { GetOrderUseCase } from '../../application/use-cases/get-order.use-case';

function sampleOrder(customerId = 'customer-1'): Order {
  return new Order(
    'order-1',
    'ANG-2026-0001',
    customerId,
    OrderStatus.PENDING,
    100,
    0,
    100,
    'MGA',
    null,
    new Date(),
    new Date(),
    [],
  );
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

describe('GetOrderUseCase', () => {
  it('throws NotFoundException for an unknown order', async () => {
    const useCase = new GetOrderUseCase(buildOrderRepository(null), buildCustomerRepository());

    await expect(useCase.execute('missing', 'user-1', 'CLIENT')).rejects.toThrow(NotFoundException);
  });

  it('returns the order to its owner', async () => {
    const useCase = new GetOrderUseCase(buildOrderRepository(sampleOrder('customer-1')), buildCustomerRepository('customer-1'));

    const order = await useCase.execute('order-1', 'user-1', 'CLIENT');
    expect(order.id).toBe('order-1');
  });

  it('rejects a CLIENT reading another customer’s order', async () => {
    const useCase = new GetOrderUseCase(buildOrderRepository(sampleOrder('customer-2')), buildCustomerRepository('customer-1'));

    await expect(useCase.execute('order-1', 'user-1', 'CLIENT')).rejects.toThrow(ForbiddenException);
  });

  it('lets MANAGER read any order without an ownership check', async () => {
    const customerRepository = buildCustomerRepository('customer-1');
    const useCase = new GetOrderUseCase(buildOrderRepository(sampleOrder('customer-2')), customerRepository);

    const order = await useCase.execute('order-1', 'staff-user', 'MANAGER');

    expect(order.id).toBe('order-1');
    expect(customerRepository.findByUserId).not.toHaveBeenCalled();
  });

  it('lets ADMIN read any order without an ownership check', async () => {
    const useCase = new GetOrderUseCase(buildOrderRepository(sampleOrder('customer-2')), buildCustomerRepository('customer-1'));

    await expect(useCase.execute('order-1', 'staff-user', 'ADMIN')).resolves.toBeDefined();
  });
});
