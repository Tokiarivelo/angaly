import type { Payment } from '../entities/payment.entity';

export const PAYMENT_REPOSITORY_TOKEN = Symbol('PAYMENT_REPOSITORY_TOKEN');

export interface IPaymentRepository {
  create: (payment: Payment) => Promise<void>;
  findById: (id: string) => Promise<Payment | null>;
  findByOrderId: (orderId: string) => Promise<Payment[]>;
  update: (payment: Payment) => Promise<void>;
  /** Every payment for orders belonging to a given Customer, most recent first — powers the "factures" tab. */
  findByCustomerId: (customerId: string) => Promise<Payment[]>;
  /** Every payment, most recent first — staff (`MANAGER`/`ADMIN`) view. */
  findAll: () => Promise<Payment[]>;
}
