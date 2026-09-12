import { Review as PrismaReview } from '@angaly/database';
import { Review } from '../../domain/entities/review.entity';
import { ReviewResponseDto } from '../../application/dtos/review-response.dto';

export class ReviewMapper {
  static toDomain(prismaReview: PrismaReview): Review {
    return new Review(
      prismaReview.id,
      prismaReview.customerId,
      prismaReview.productId,
      prismaReview.rating,
      prismaReview.comment,
      prismaReview.isVerified,
      prismaReview.createdAt,
    );
  }

  static toPersistence(review: Review): Omit<PrismaReview, 'createdAt'> {
    return {
      id: review.id,
      customerId: review.customerId,
      productId: review.productId,
      rating: review.rating,
      comment: review.comment,
      isVerified: review.isVerified,
    };
  }

  static toResponseDto(review: Review): ReviewResponseDto {
    return {
      id: review.id,
      customerId: review.customerId,
      productId: review.productId,
      rating: review.rating,
      comment: review.comment,
      isVerified: review.isVerified,
      createdAt: review.createdAt.toISOString(),
      updatedAt: review.createdAt.toISOString(), // Reviews don't have updatedAt in Prisma, fallback to createdAt
    };
  }
}
