import { Payment } from '../entities/payment.entity';

export const PAYMENT_REPOSITORY_TOKEN = Symbol('PAYMENT_REPOSITORY_TOKEN');

export interface IPaymentRepository {
  create(payment: Payment): Promise<void>;
  findById(id: string): Promise<Payment | null>;
  findByOrderId(orderId: string): Promise<Payment[]>;
  update(payment: Payment): Promise<void>;
}
