export class Review {
  constructor(
    public readonly id: string,
    public readonly customerId: string,
    public readonly productId: string | null,
    public readonly rating: number,
    public readonly comment: string | null,
    public readonly isVerified: boolean,
    public readonly createdAt: Date,
  ) {
    if (rating < 1 || rating > 5) {
      throw new Error('Rating must be between 1 and 5');
    }
  }

  public verify(): Review {
    return new Review(
      this.id,
      this.customerId,
      this.productId,
      this.rating,
      this.comment,
      true,
      this.createdAt,
    );
  }
}
