import { BadRequestException, NotFoundException } from '@nestjs/common';
import { OrderStatus } from '@angaly/types';

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

describe('UpdateOrderStatusUseCase', () => {
  it('throws NotFoundException for an unknown order', async () => {
    const useCase = new UpdateOrderStatusUseCase(buildOrderRepository(null));

    await expect(useCase.execute('missing', OrderStatus.CONFIRMED)).rejects.toThrow(NotFoundException);
  });

  it('applies a valid transition and persists it', async () => {
    const orderRepository = buildOrderRepository(sampleOrder(OrderStatus.PENDING));
    const useCase = new UpdateOrderStatusUseCase(orderRepository);

    const order = await useCase.execute('order-1', OrderStatus.CONFIRMED);

    expect(order.status).toBe(OrderStatus.CONFIRMED);
    expect(orderRepository.update).toHaveBeenCalledWith(order);
  });

  it('rejects an invalid transition as a BadRequestException, not a raw Error', async () => {
    const orderRepository = buildOrderRepository(sampleOrder(OrderStatus.PENDING));
    const useCase = new UpdateOrderStatusUseCase(orderRepository);

    await expect(useCase.execute('order-1', OrderStatus.DELIVERED)).rejects.toThrow(BadRequestException);
    expect(orderRepository.update).not.toHaveBeenCalled();
  });
});
