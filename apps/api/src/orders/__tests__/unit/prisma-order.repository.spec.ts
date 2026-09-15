import { OrderStatus } from '@angaly/types';

import type { PrismaService } from '../../../prisma/prisma.service';
import { Order } from '../../domain/entities/order.entity';
import { OrderItem } from '../../domain/entities/order-item.entity';
import { PrismaOrderRepository } from '../../infrastructure/repositories/prisma-order.repository';

interface MockOrderDelegate {
  create: jest.Mock;
  findUnique: jest.Mock;
  findMany: jest.Mock;
  update: jest.Mock;
}

function buildPrismaServiceMock(): { prisma: PrismaService; order: MockOrderDelegate } {
  const order: MockOrderDelegate = { create: jest.fn(), findUnique: jest.fn(), findMany: jest.fn(), update: jest.fn() };
  const prisma = { order } as unknown as PrismaService;
  return { prisma, order };
}

function orderRecord(overrides: Partial<{ shippingAddressJson: unknown }> = {}) {
  return {
    id: 'order-1',
    orderNumber: 'ANG-2026-0001',
    customerId: 'customer-1',
    status: OrderStatus.PENDING,
    subtotal: 100 as unknown,
    shippingCost: 0 as unknown,
    total: 100 as unknown,
    currency: 'MGA',
    shippingAddressJson: overrides.shippingAddressJson ?? null,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    items: [{ id: 'item-1', orderId: 'order-1', productVariantId: 'variant-1', quantity: 2, unitPrice: 50 as unknown }],
  };
}

describe('PrismaOrderRepository', () => {
  it('create() writes the order with its items', async () => {
    const { prisma, order } = buildPrismaServiceMock();
    const repository = new PrismaOrderRepository(prisma);

    const domainOrder = new Order(
      'order-1',
      'ANG-2026-0001',
      'customer-1',
      OrderStatus.PENDING,
      100,
      0,
      100,
      'MGA',
      null,
      new Date(),
      new Date(),
      [new OrderItem('item-1', 'order-1', 'variant-1', 2, 50)],
    );

    await repository.create(domainOrder);

    const call = order.create.mock.calls[0]?.[0] as { data: { id: string; customerId: string; shippingAddressJson: unknown } };
    expect(call.data.id).toBe('order-1');
    expect(call.data.customerId).toBe('customer-1');
    expect(call.data.shippingAddressJson).toBeUndefined();
  });

  it('findById() returns null when no row matches', async () => {
    const { prisma, order } = buildPrismaServiceMock();
    order.findUnique.mockResolvedValue(null);

    expect(await new PrismaOrderRepository(prisma).findById('missing')).toBeNull();
  });

  it('findById() maps a found row to a domain entity', async () => {
    const { prisma, order } = buildPrismaServiceMock();
    order.findUnique.mockResolvedValue(orderRecord());

    const result = await new PrismaOrderRepository(prisma).findById('order-1');
    expect(result?.id).toBe('order-1');
    expect(result?.items).toHaveLength(1);
  });

  it('findByOrderNumber() returns null when no row matches', async () => {
    const { prisma, order } = buildPrismaServiceMock();
    order.findUnique.mockResolvedValue(null);

    expect(await new PrismaOrderRepository(prisma).findByOrderNumber('missing')).toBeNull();
  });

  it('findByOrderNumber() maps a found row to a domain entity', async () => {
    const { prisma, order } = buildPrismaServiceMock();
    order.findUnique.mockResolvedValue(orderRecord());

    const result = await new PrismaOrderRepository(prisma).findByOrderNumber('ANG-2026-0001');
    expect(result?.orderNumber).toBe('ANG-2026-0001');
  });

  it('findByCustomerId() maps every row for a customer', async () => {
    const { prisma, order } = buildPrismaServiceMock();
    order.findMany.mockResolvedValue([orderRecord()]);

    const result = await new PrismaOrderRepository(prisma).findByCustomerId('customer-1');
    expect(result).toHaveLength(1);
    expect(order.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { customerId: 'customer-1' } }));
  });

  it('findAll() maps every order, unfiltered', async () => {
    const { prisma, order } = buildPrismaServiceMock();
    order.findMany.mockResolvedValue([orderRecord()]);

    const result = await new PrismaOrderRepository(prisma).findAll();
    expect(result).toHaveLength(1);
    const call = order.findMany.mock.calls[0]?.[0] as { where?: unknown };
    expect(call.where).toBeUndefined();
  });

  it('update() persists the current status', async () => {
    const { prisma, order } = buildPrismaServiceMock();
    const domainOrder = new Order(
      'order-1',
      'ANG-2026-0001',
      'customer-1',
      OrderStatus.CONFIRMED,
      100,
      0,
      100,
      'MGA',
      null,
      new Date(),
      new Date(),
      [],
    );

    await new PrismaOrderRepository(prisma).update(domainOrder);

    expect(order.update).toHaveBeenCalledWith({ where: { id: 'order-1' }, data: { status: OrderStatus.CONFIRMED } });
  });
});
