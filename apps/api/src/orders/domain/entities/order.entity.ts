import { OrderStatus } from '@angaly/types';
import { OrderItem } from './order-item.entity';

export class Order {
  constructor(
    public readonly id: string,
    public readonly orderNumber: string,
    public readonly customerId: string,
    private _status: OrderStatus,
    public subtotal: number,
    public shippingCost: number,
    public total: number,
    public currency: string,
    public shippingAddressJson: any | null,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
    public items: OrderItem[] = [],
  ) {
    this.validateTotals();
  }

  get status(): OrderStatus {
    return this._status;
  }

  public validateTotals(): void {
    const computedSubtotal = this.items.reduce((acc, item) => acc + item.lineTotal, 0);
    // Allowing minor floating point diffs or enforcing exact match if Decimal was fully parsed
    // For now we assume the DB values are passed correctly, but we can check if it deviates significantly
    if (Math.abs(computedSubtotal - this.subtotal) > 0.01 && this.items.length > 0) {
      throw new Error(`Order subtotal mismatch: expected ${computedSubtotal}, got ${this.subtotal}`);
    }
    const computedTotal = this.subtotal + this.shippingCost;
    if (Math.abs(computedTotal - this.total) > 0.01) {
      throw new Error(`Order total mismatch: expected ${computedTotal}, got ${this.total}`);
    }
  }

  public transitionTo(newStatus: OrderStatus): void {
    const validTransitions: Record<OrderStatus, OrderStatus[]> = {
      [OrderStatus.PENDING]: [OrderStatus.CONFIRMED, OrderStatus.CANCELLED],
      [OrderStatus.CONFIRMED]: [OrderStatus.PAID, OrderStatus.CANCELLED],
      [OrderStatus.PAID]: [OrderStatus.IN_PRODUCTION, OrderStatus.REFUNDED],
      [OrderStatus.IN_PRODUCTION]: [OrderStatus.READY, OrderStatus.REFUNDED],
      [OrderStatus.READY]: [OrderStatus.DELIVERED, OrderStatus.REFUNDED],
      [OrderStatus.DELIVERED]: [OrderStatus.REFUNDED],
      [OrderStatus.CANCELLED]: [],
      [OrderStatus.REFUNDED]: [],
    };

    if (!validTransitions[this._status].includes(newStatus)) {
      throw new Error(`Invalid order status transition from ${this._status} to ${newStatus}`);
    }

    this._status = newStatus;
  }
}
