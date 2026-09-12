import { Review } from '../entities/review.entity';

export interface IReviewRepository {
  create(review: Review): Promise<Review>;
  findByProductId(productId: string): Promise<Review[]>;
  findById(id: string): Promise<Review | null>;
  update(review: Review): Promise<Review>;
}
