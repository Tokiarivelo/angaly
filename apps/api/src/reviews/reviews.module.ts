import { Module } from '@nestjs/common';

import { ReviewsController } from './presentation/controllers/reviews.controller';
import { TestimonialsController } from './presentation/controllers/testimonials.controller';
import { CreateReviewUseCase } from './application/use-cases/create-review.use-case';
import { ListReviewsForProductUseCase } from './application/use-cases/list-reviews-for-product.use-case';
import { MarkReviewVerifiedUseCase } from './application/use-cases/mark-review-verified.use-case';
import { ListFeaturedTestimonialsUseCase } from './application/use-cases/list-featured-testimonials.use-case';
import { PrismaReviewRepository } from './infrastructure/repositories/prisma-review.repository';
import { PrismaTestimonialRepository } from './infrastructure/repositories/prisma-testimonial.repository';

import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [ReviewsController, TestimonialsController],
  providers: [
    CreateReviewUseCase,
    ListReviewsForProductUseCase,
    MarkReviewVerifiedUseCase,
    ListFeaturedTestimonialsUseCase,
    {
      provide: 'IReviewRepository',
      useClass: PrismaReviewRepository,
    },
    {
      provide: 'ITestimonialRepository',
      useClass: PrismaTestimonialRepository,
    },
  ],
})
export class ReviewsModule {}
