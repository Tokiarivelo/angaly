import { Prisma } from '@angaly/database';
import { OrderStatus } from '@angaly/types';

import { Order } from '../../domain/entities/order.entity';
import { OrderItem } from '../../domain/entities/order-item.entity';
import { OrderMapper } from '../../infrastructure/mappers/order.mapper';

function prismaOrderRecord(overrides: Partial<{ items: unknown }> = {}) {
  return {
    id: 'order-1',
    orderNumber: 'ANG-2026-0001',
    customerId: 'customer-1',
    status: OrderStatus.PENDING,
    subtotal: new Prisma.Decimal('100.00'),
    shippingCost: new Prisma.Decimal('0.00'),
    total: new Prisma.Decimal('100.00'),
    currency: 'MGA',
    shippingAddressJson: null,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-02T00:00:00.000Z'),
    items: overrides.items,
  } as never;
}

describe('OrderMapper', () => {
  describe('toDomain', () => {
    it('maps a Prisma record with items to a domain entity', () => {
      const order = OrderMapper.toDomain(
        prismaOrderRecord({
          items: [{ id: 'item-1', orderId: 'order-1', productVariantId: 'variant-1', quantity: 2, unitPrice: new Prisma.Decimal('50.00') }],
        }),
      );

      expect(order.id).toBe('order-1');
      expect(order.subtotal).toBe(100);
      expect(order.items).toHaveLength(1);
      expect(order.items[0]?.unitPrice).toBe(50);
    });

    it('defaults to an empty items array when the Prisma record has none included', () => {
      const order = OrderMapper.toDomain(prismaOrderRecord({ items: undefined }));
      expect(order.items).toEqual([]);
    });
  });

  describe('toResponseDto', () => {
    it('formats every money field as a fixed 2-decimal string and dates as ISO strings', () => {
      const order = new Order(
        'order-1',
        'ANG-2026-0001',
        'customer-1',
        OrderStatus.PENDING,
        100,
        5.5,
        105.5,
        'MGA',
        { line1: '12 Rue de l’Artisanat' },
        new Date('2026-01-01T00:00:00.000Z'),
        new Date('2026-01-02T00:00:00.000Z'),
        [new OrderItem('item-1', 'order-1', 'variant-1', 2, 50)],
      );

      const dto = OrderMapper.toResponseDto(order);

      expect(dto.subtotal).toBe('100.00');
      expect(dto.shippingCost).toBe('5.50');
      expect(dto.total).toBe('105.50');
      expect(dto.createdAt).toBe('2026-01-01T00:00:00.000Z');
      expect(dto.updatedAt).toBe('2026-01-02T00:00:00.000Z');
      expect(dto.shippingAddressJson).toEqual({ line1: '12 Rue de l’Artisanat' });
      expect(dto.items[0]).toEqual({ id: 'item-1', orderId: 'order-1', productVariantId: 'variant-1', quantity: 2, unitPrice: '50.00' });
    });
  });
});
