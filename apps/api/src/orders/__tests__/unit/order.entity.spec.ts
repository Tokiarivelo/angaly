import { OrderStatus } from '@angaly/types';

import { Order } from '../../domain/entities/order.entity';
import { OrderItem } from '../../domain/entities/order-item.entity';

function buildOrder(overrides: Partial<{ status: OrderStatus; subtotal: number; shippingCost: number; total: number; items: OrderItem[] }> = {}): Order {
  const items = overrides.items ?? [new OrderItem('item-1', 'order-1', 'variant-1', 2, 50)];
  const subtotal = overrides.subtotal ?? items.reduce((acc, item) => acc + item.lineTotal, 0);
  const shippingCost = overrides.shippingCost ?? 0;
  const total = overrides.total ?? subtotal + shippingCost;

  return new Order(
    'order-1',
    'ANG-2026-0001',
    'customer-1',
    overrides.status ?? OrderStatus.PENDING,
    subtotal,
    shippingCost,
    total,
    'MGA',
    null,
    new Date('2026-01-01T00:00:00.000Z'),
    new Date('2026-01-01T00:00:00.000Z'),
    items,
  );
}

describe('Order', () => {
  it('constructs successfully when totals are consistent', () => {
    const order = buildOrder();
    expect(order.subtotal).toBe(100);
    expect(order.total).toBe(100);
  });

  it('rejects a subtotal that does not match the sum of item line totals', () => {
    expect(() => buildOrder({ subtotal: 999 })).toThrow(/subtotal mismatch/);
  });

  it('rejects a total that does not match subtotal + shippingCost', () => {
    expect(() => buildOrder({ total: 999 })).toThrow(/total mismatch/);
  });

  it('skips the subtotal-vs-items check for an order with no items yet (still allows a non-zero subtotal)', () => {
    expect(() => buildOrder({ items: [], subtotal: 250, total: 250 })).not.toThrow();
  });

  describe('transitionTo', () => {
    it('allows PENDING -> CONFIRMED', () => {
      const order = buildOrder({ status: OrderStatus.PENDING });
      order.transitionTo(OrderStatus.CONFIRMED);
      expect(order.status).toBe(OrderStatus.CONFIRMED);
    });

    it('allows PENDING -> CANCELLED', () => {
      const order = buildOrder({ status: OrderStatus.PENDING });
      order.transitionTo(OrderStatus.CANCELLED);
      expect(order.status).toBe(OrderStatus.CANCELLED);
    });

    it('allows CONFIRMED -> PAID', () => {
      const order = buildOrder({ status: OrderStatus.CONFIRMED });
      order.transitionTo(OrderStatus.PAID);
      expect(order.status).toBe(OrderStatus.PAID);
    });

    it('rejects PENDING -> PAID (must go through CONFIRMED)', () => {
      const order = buildOrder({ status: OrderStatus.PENDING });
      expect(() => order.transitionTo(OrderStatus.PAID)).toThrow(/Invalid order status transition/);
    });

    it('rejects any transition out of a terminal CANCELLED order', () => {
      const order = buildOrder({ status: OrderStatus.CANCELLED });
      expect(() => order.transitionTo(OrderStatus.CONFIRMED)).toThrow(/Invalid order status transition/);
    });

    it('rejects any transition out of a terminal REFUNDED order', () => {
      const order = buildOrder({ status: OrderStatus.REFUNDED });
      expect(() => order.transitionTo(OrderStatus.PAID)).toThrow(/Invalid order status transition/);
    });

    it('allows DELIVERED -> REFUNDED', () => {
      const order = buildOrder({ status: OrderStatus.DELIVERED });
      order.transitionTo(OrderStatus.REFUNDED);
      expect(order.status).toBe(OrderStatus.REFUNDED);
    });
  });
});
