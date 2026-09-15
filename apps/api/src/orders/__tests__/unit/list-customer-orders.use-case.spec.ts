import { OrderStatus } from '@angaly/types';

import { CustomerEntity } from '../../../customers/domain/entities/customer.entity';
import type { ICustomerRepository } from '../../../customers/domain/repositories/customer.repository';
import { Order } from '../../domain/entities/order.entity';
import type { IOrderRepository } from '../../domain/repositories/order.repository';
import { ListCustomerOrdersUseCase } from '../../application/use-cases/list-customer-orders.use-case';

function sampleOrder(id: string, customerId: string): Order {
  return new Order(id, `ANG-2026-${id}`, customerId, OrderStatus.PENDING, 100, 0, 100, 'MGA', null, new Date(), new Date(), []);
}

function buildOrderRepository(): jest.Mocked<IOrderRepository> {
  return {
    create: jest.fn(),
    findById: jest.fn(),
    findByOrderNumber: jest.fn(),
    findByCustomerId: jest.fn().mockResolvedValue([sampleOrder('order-1', 'customer-1')]),
    findAll: jest.fn().mockResolvedValue([sampleOrder('order-1', 'customer-1'), sampleOrder('order-2', 'customer-2')]),
    update: jest.fn(),
  };
}

function buildCustomerRepository(): jest.Mocked<ICustomerRepository> {
  const customer = CustomerEntity.create({
    id: 'customer-1',
    userId: 'user-1',
    firstName: 'Nirina',
    lastName: 'Rakoto',
    phone: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  return { findByUserId: jest.fn().mockResolvedValue(customer), findById: jest.fn(), update: jest.fn() };
}

describe('ListCustomerOrdersUseCase', () => {
  it('returns only the caller’s own orders for CLIENT', async () => {
    const orderRepository = buildOrderRepository();
    const useCase = new ListCustomerOrdersUseCase(orderRepository, buildCustomerRepository());

    const orders = await useCase.execute('user-1', 'CLIENT');

    expect(orders).toHaveLength(1);
    expect(orderRepository.findByCustomerId).toHaveBeenCalledWith('customer-1');
    expect(orderRepository.findAll).not.toHaveBeenCalled();
  });

  it('returns every order for MANAGER', async () => {
    const orderRepository = buildOrderRepository();
    const useCase = new ListCustomerOrdersUseCase(orderRepository, buildCustomerRepository());

    const orders = await useCase.execute('staff-user', 'MANAGER');

    expect(orders).toHaveLength(2);
    expect(orderRepository.findByCustomerId).not.toHaveBeenCalled();
  });

  it('returns every order for ADMIN', async () => {
    const orderRepository = buildOrderRepository();
    const useCase = new ListCustomerOrdersUseCase(orderRepository, buildCustomerRepository());

    const orders = await useCase.execute('staff-user', 'ADMIN');

    expect(orders).toHaveLength(2);
  });
});
