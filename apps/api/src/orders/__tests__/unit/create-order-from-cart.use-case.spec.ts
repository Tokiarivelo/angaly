import { BadRequestException } from '@nestjs/common';

import { CustomerEntity } from '../../../customers/domain/entities/customer.entity';
import type { ICustomerRepository } from '../../../customers/domain/repositories/customer.repository';
import type { CreateNotificationUseCase } from '../../../notifications/application/use-cases/create-notification.use-case';
import type { PrismaService } from '../../../prisma/prisma.service';
import { CreateOrderFromCartUseCase } from '../../application/use-cases/create-order-from-cart.use-case';

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
  return { findByUserId: jest.fn().mockResolvedValue(customer), findById: jest.fn(), update: jest.fn() };
}

function buildCreateNotificationUseCase(): jest.Mocked<CreateNotificationUseCase> {
  return { execute: jest.fn().mockResolvedValue(undefined) } as unknown as jest.Mocked<CreateNotificationUseCase>;
}

interface MockTx {
  productVariant: { findUnique: jest.Mock };
  inventory: { updateMany: jest.Mock };
  order: { create: jest.Mock };
}

function buildPrismaServiceMock(): { prisma: PrismaService; tx: MockTx } {
  const tx: MockTx = {
    productVariant: { findUnique: jest.fn() },
    inventory: { updateMany: jest.fn() },
    order: { create: jest.fn() },
  };
  const prisma = { $transaction: jest.fn((fn: (tx: MockTx) => unknown) => fn(tx)) } as unknown as PrismaService;
  return { prisma, tx };
}

function variantRecord(overrides: Partial<{ priceOverride: unknown; productPrice: unknown; inventoryId: string; quantityAvailable: number }> = {}) {
  return {
    id: 'variant-1',
    priceOverride: overrides.priceOverride ?? null,
    product: { price: overrides.productPrice ?? 50000 },
    inventory: { id: overrides.inventoryId ?? 'inventory-1', quantityAvailable: overrides.quantityAvailable ?? 10 },
  };
}

describe('CreateOrderFromCartUseCase', () => {
  it('rejects an order with no items', async () => {
    const { prisma } = buildPrismaServiceMock();
    const useCase = new CreateOrderFromCartUseCase(prisma, buildCustomerRepository(), buildCreateNotificationUseCase());

    await expect(useCase.execute({ userId: 'user-1', items: [] })).rejects.toThrow(BadRequestException);
  });

  it('creates an order, reserving stock and computing the subtotal from the product price', async () => {
    const { prisma, tx } = buildPrismaServiceMock();
    tx.productVariant.findUnique.mockResolvedValue(variantRecord({ quantityAvailable: 5 }));
    tx.inventory.updateMany.mockResolvedValue({ count: 1 });
    const useCase = new CreateOrderFromCartUseCase(prisma, buildCustomerRepository(), buildCreateNotificationUseCase());

    const order = await useCase.execute({
      userId: 'user-1',
      items: [{ productVariantId: 'variant-1', quantity: 2 }],
    });

    expect(order.customerId).toBe('customer-1');
    expect(order.subtotal).toBe(100000);
    expect(order.total).toBe(100000);
    expect(order.items).toHaveLength(1);
    expect(tx.inventory.updateMany).toHaveBeenCalledWith({
      where: { id: 'inventory-1', quantityAvailable: { gte: 2 } },
      data: { quantityAvailable: { decrement: 2 } },
    });
    expect(tx.order.create).toHaveBeenCalledTimes(1);
  });

  it('prefers priceOverride over the product price when set', async () => {
    const { prisma, tx } = buildPrismaServiceMock();
    tx.productVariant.findUnique.mockResolvedValue(variantRecord({ priceOverride: 40000, productPrice: 50000 }));
    tx.inventory.updateMany.mockResolvedValue({ count: 1 });
    const useCase = new CreateOrderFromCartUseCase(prisma, buildCustomerRepository(), buildCreateNotificationUseCase());

    const order = await useCase.execute({ userId: 'user-1', items: [{ productVariantId: 'variant-1', quantity: 1 }] });

    expect(order.subtotal).toBe(40000);
  });

  it('rejects when the variant does not exist', async () => {
    const { prisma, tx } = buildPrismaServiceMock();
    tx.productVariant.findUnique.mockResolvedValue(null);
    const useCase = new CreateOrderFromCartUseCase(prisma, buildCustomerRepository(), buildCreateNotificationUseCase());

    await expect(
      useCase.execute({ userId: 'user-1', items: [{ productVariantId: 'missing', quantity: 1 }] }),
    ).rejects.toThrow(BadRequestException);
  });

  it('rejects when the atomic stock reservation fails (insufficient stock or lost the race)', async () => {
    const { prisma, tx } = buildPrismaServiceMock();
    tx.productVariant.findUnique.mockResolvedValue(variantRecord({ quantityAvailable: 1 }));
    tx.inventory.updateMany.mockResolvedValue({ count: 0 });
    const useCase = new CreateOrderFromCartUseCase(prisma, buildCustomerRepository(), buildCreateNotificationUseCase());

    await expect(
      useCase.execute({ userId: 'user-1', items: [{ productVariantId: 'variant-1', quantity: 5 }] }),
    ).rejects.toThrow(/Not enough stock/);
    expect(tx.order.create).not.toHaveBeenCalled();
  });

  it('resolves the customerId from the JWT userId rather than trusting a raw customerId', async () => {
    const { prisma, tx } = buildPrismaServiceMock();
    tx.productVariant.findUnique.mockResolvedValue(variantRecord());
    tx.inventory.updateMany.mockResolvedValue({ count: 1 });
    const customerRepository = buildCustomerRepository();
    const useCase = new CreateOrderFromCartUseCase(prisma, customerRepository, buildCreateNotificationUseCase());

    await useCase.execute({ userId: 'user-1', items: [{ productVariantId: 'variant-1', quantity: 1 }] });

    expect(customerRepository.findByUserId).toHaveBeenCalledWith('user-1');
  });
});
