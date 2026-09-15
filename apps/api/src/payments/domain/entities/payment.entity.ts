import type { PaymentMethod } from '@angaly/types';
import { PaymentStatus } from '@angaly/types';

export class Payment {
  constructor(
    public readonly id: string,
    public readonly orderId: string,
    public readonly method: PaymentMethod,
    private _status: PaymentStatus,
    public readonly amount: number,
    public transactionRef: string | null,
    public paidAt: Date | null,
    public readonly createdAt: Date,
  ) {
    if (amount <= 0) {
      throw new Error('Payment amount must be greater than zero');
    }
  }

  get status(): PaymentStatus {
    return this._status;
  }

  public confirm(transactionRef?: string): void {
    if (this._status !== PaymentStatus.PENDING && this._status !== PaymentStatus.AUTHORIZED) {
      throw new Error(`Cannot confirm payment from status ${this._status}`);
    }
    this._status = PaymentStatus.PAID;
    this.paidAt = new Date();
    if (transactionRef) {
      this.transactionRef = transactionRef;
    }
  }

  public fail(): void {
    this._status = PaymentStatus.FAILED;
  }

  public refund(): void {
    if (this._status !== PaymentStatus.PAID) {
      throw new Error('Cannot refund a payment that is not PAID');
    }
    this._status = PaymentStatus.REFUNDED;
  }
}
