import type { Order } from '../entities/order.entity';

export const ORDER_REPOSITORY_TOKEN = Symbol('ORDER_REPOSITORY_TOKEN');

export interface IOrderRepository {
  create: (order: Order) => Promise<void>;
  findById: (id: string) => Promise<Order | null>;
  findByOrderNumber: (orderNumber: string) => Promise<Order | null>;
  findByCustomerId: (customerId: string) => Promise<Order[]>;
  /** Staff-only listing — every order, newest first (see `list-customer-orders.use-case.ts`). */
  findAll: () => Promise<Order[]>;
  update: (order: Order) => Promise<void>;
}
