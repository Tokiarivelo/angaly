export class OrderItem {
  constructor(
    public readonly id: string,
    public readonly orderId: string,
    public readonly productVariantId: string,
    public quantity: number,
    public unitPrice: number,
  ) {
    if (quantity <= 0) {
      throw new Error('OrderItem quantity must be strictly positive');
    }
    if (unitPrice < 0) {
      throw new Error('OrderItem unitPrice cannot be negative');
    }
  }

  get lineTotal(): number {
    return this.quantity * this.unitPrice;
  }
}
