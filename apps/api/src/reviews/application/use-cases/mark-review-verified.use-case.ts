import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { IReviewRepository } from '../../domain/repositories/review.repository';
import { Review } from '../../domain/entities/review.entity';

@Injectable()
export class MarkReviewVerifiedUseCase {
  constructor(
    @Inject('IReviewRepository')
    private readonly reviewRepository: IReviewRepository,
  ) {}

  async execute(reviewId: string): Promise<Review> {
    const review = await this.reviewRepository.findById(reviewId);
    if (!review) {
      throw new NotFoundException(`Review with ID ${reviewId} not found`);
    }

    const verifiedReview = review.verify();
    return this.reviewRepository.update(verifiedReview);
  }
}
