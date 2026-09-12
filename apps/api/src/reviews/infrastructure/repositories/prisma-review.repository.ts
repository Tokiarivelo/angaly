import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { IReviewRepository } from '../../domain/repositories/review.repository';
import { Review } from '../../domain/entities/review.entity';
import { ReviewMapper } from '../mappers/review.mapper';

@Injectable()
export class PrismaReviewRepository implements IReviewRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(review: Review): Promise<Review> {
    const data = ReviewMapper.toPersistence(review);
    
    const prismaReview = await this.prisma.review.create({
      data: {
        customerId: data.customerId,
        productId: data.productId,
        rating: data.rating,
        comment: data.comment,
        isVerified: data.isVerified,
      },
    });

    return ReviewMapper.toDomain(prismaReview);
  }

  async findByProductId(productId: string): Promise<Review[]> {
    const prismaReviews = await this.prisma.review.findMany({
      where: { productId },
      orderBy: { createdAt: 'desc' },
    });

    return prismaReviews.map(ReviewMapper.toDomain);
  }

  async findById(id: string): Promise<Review | null> {
    const prismaReview = await this.prisma.review.findUnique({
      where: { id },
    });

    if (!prismaReview) return null;
    return ReviewMapper.toDomain(prismaReview);
  }

  async update(review: Review): Promise<Review> {
    const data = ReviewMapper.toPersistence(review);
    
    const prismaReview = await this.prisma.review.update({
      where: { id: data.id },
      data: {
        isVerified: data.isVerified,
      },
    });

    return ReviewMapper.toDomain(prismaReview);
  }
}
