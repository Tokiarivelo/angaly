import { Inject, Injectable } from '@nestjs/common';
import { IReviewRepository } from '../../domain/repositories/review.repository';
import { Review } from '../../domain/entities/review.entity';

@Injectable()
export class ListReviewsForProductUseCase {
  constructor(
    @Inject('IReviewRepository')
    private readonly reviewRepository: IReviewRepository,
  ) {}

  async execute(productId: string): Promise<Review[]> {
    return this.reviewRepository.findByProductId(productId);
  }
}
