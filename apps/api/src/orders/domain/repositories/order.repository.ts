import { Order } from '../entities/order.entity';

export const ORDER_REPOSITORY_TOKEN = Symbol('ORDER_REPOSITORY_TOKEN');

export interface IOrderRepository {
  create(order: Order): Promise<void>;
  findById(id: string): Promise<Order | null>;
  findByOrderNumber(orderNumber: string): Promise<Order | null>;
  findByCustomerId(customerId: string): Promise<Order[]>;
  update(order: Order): Promise<void>;
}
