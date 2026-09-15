import { OrderItem } from '../../domain/entities/order-item.entity';

describe('OrderItem', () => {
  it('computes lineTotal as quantity * unitPrice', () => {
    const item = new OrderItem('item-1', 'order-1', 'variant-1', 3, 1500);
    expect(item.lineTotal).toBe(4500);
  });

  it('rejects a zero quantity', () => {
    expect(() => new OrderItem('item-1', 'order-1', 'variant-1', 0, 100)).toThrow(
      'OrderItem quantity must be strictly positive',
    );
  });

  it('rejects a negative quantity', () => {
    expect(() => new OrderItem('item-1', 'order-1', 'variant-1', -1, 100)).toThrow(
      'OrderItem quantity must be strictly positive',
    );
  });

  it('rejects a negative unitPrice', () => {
    expect(() => new OrderItem('item-1', 'order-1', 'variant-1', 1, -1)).toThrow(
      'OrderItem unitPrice cannot be negative',
    );
  });

  it('accepts a zero unitPrice', () => {
    expect(() => new OrderItem('item-1', 'order-1', 'variant-1', 1, 0)).not.toThrow();
  });
});
