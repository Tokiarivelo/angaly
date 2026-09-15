import { BadRequestException, NotFoundException } from '@nestjs/common';
import { OrderStatus } from '@angaly/types';

import { CustomerEntity } from '../../../customers/domain/entities/customer.entity';
import type { ICustomerRepository } from '../../../customers/domain/repositories/customer.repository';
import type { CreateNotificationUseCase } from '../../../notifications/application/use-cases/create-notification.use-case';
import { Order } from '../../domain/entities/order.entity';
import type { IOrderRepository } from '../../domain/repositories/order.repository';
import { UpdateOrderStatusUseCase } from '../../application/use-cases/update-order-status.use-case';

function sampleOrder(status: OrderStatus): Order {
  return new Order('order-1', 'ANG-2026-0001', 'customer-1', status, 100, 0, 100, 'MGA', null, new Date(), new Date(), []);
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

function sampleCustomer(): CustomerEntity {
  return CustomerEntity.create({
    id: 'customer-1',
    userId: 'user-1',
    firstName: 'Nirina',
    lastName: 'Rakoto',
    phone: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

function buildCustomerRepository(customer: CustomerEntity | null = sampleCustomer()): jest.Mocked<ICustomerRepository> {
  return { findByUserId: jest.fn(), findById: jest.fn().mockResolvedValue(customer), update: jest.fn() };
}

function buildCreateNotificationUseCase(): jest.Mocked<CreateNotificationUseCase> {
  return { execute: jest.fn().mockResolvedValue(undefined) } as unknown as jest.Mocked<CreateNotificationUseCase>;
}

describe('UpdateOrderStatusUseCase', () => {
  it('throws NotFoundException for an unknown order', async () => {
    const useCase = new UpdateOrderStatusUseCase(buildOrderRepository(null), buildCustomerRepository(), buildCreateNotificationUseCase());

    await expect(useCase.execute('missing', OrderStatus.CONFIRMED)).rejects.toThrow(NotFoundException);
  });

  it('applies a valid transition and persists it', async () => {
    const orderRepository = buildOrderRepository(sampleOrder(OrderStatus.PENDING));
    const useCase = new UpdateOrderStatusUseCase(orderRepository, buildCustomerRepository(), buildCreateNotificationUseCase());

    const order = await useCase.execute('order-1', OrderStatus.CONFIRMED);

    expect(order.status).toBe(OrderStatus.CONFIRMED);
    expect(orderRepository.update).toHaveBeenCalledWith(order);
  });

  it('rejects an invalid transition as a BadRequestException, not a raw Error', async () => {
    const orderRepository = buildOrderRepository(sampleOrder(OrderStatus.PENDING));
    const useCase = new UpdateOrderStatusUseCase(orderRepository, buildCustomerRepository(), buildCreateNotificationUseCase());

    await expect(useCase.execute('order-1', OrderStatus.DELIVERED)).rejects.toThrow(BadRequestException);
    expect(orderRepository.update).not.toHaveBeenCalled();
  });

  it('emits an ORDER_STATUS_CHANGED notification to the order owner', async () => {
    const orderRepository = buildOrderRepository(sampleOrder(OrderStatus.PENDING));
    const createNotificationUseCase = buildCreateNotificationUseCase();
    const useCase = new UpdateOrderStatusUseCase(orderRepository, buildCustomerRepository(), createNotificationUseCase);

    await useCase.execute('order-1', OrderStatus.CONFIRMED);

    expect(createNotificationUseCase.execute).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 'user-1', type: 'ORDER_STATUS_CHANGED', relatedEntityId: 'order-1' }),
    );
  });

  it('does not fail the transition when notifying fails', async () => {
    const orderRepository = buildOrderRepository(sampleOrder(OrderStatus.PENDING));
    const createNotificationUseCase = buildCreateNotificationUseCase();
    createNotificationUseCase.execute.mockRejectedValue(new Error('notifications down'));
    const useCase = new UpdateOrderStatusUseCase(orderRepository, buildCustomerRepository(), createNotificationUseCase);

    const order = await useCase.execute('order-1', OrderStatus.CONFIRMED);

    expect(order.status).toBe(OrderStatus.CONFIRMED);
  });

  it('skips notifying when the order has no resolvable customer', async () => {
    const orderRepository = buildOrderRepository(sampleOrder(OrderStatus.PENDING));
    const createNotificationUseCase = buildCreateNotificationUseCase();
    const useCase = new UpdateOrderStatusUseCase(orderRepository, buildCustomerRepository(null), createNotificationUseCase);

    await useCase.execute('order-1', OrderStatus.CONFIRMED);

    expect(createNotificationUseCase.execute).not.toHaveBeenCalled();
  });
});
