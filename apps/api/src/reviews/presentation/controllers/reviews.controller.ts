import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../auth/presentation/guards/jwt-auth.guard';
import { RolesGuard } from '../../../auth/presentation/guards/roles.guard';
import { Roles } from '../../../auth/presentation/decorators/roles.decorator';
import { CurrentUser } from '../../../auth/presentation/decorators/current-user.decorator';
import { CreateReviewUseCase } from '../../application/use-cases/create-review.use-case';
import { ListReviewsForProductUseCase } from '../../application/use-cases/list-reviews-for-product.use-case';
import { MarkReviewVerifiedUseCase } from '../../application/use-cases/mark-review-verified.use-case';
import { CreateReviewDto } from '../../application/dtos/create-review.dto';
import { ReviewResponseDto } from '../../application/dtos/review-response.dto';
import { ReviewMapper } from '../../infrastructure/mappers/review.mapper';

@ApiTags('Reviews')
@Controller()
export class ReviewsController {
  constructor(
    private readonly createReviewUseCase: CreateReviewUseCase,
    private readonly listReviewsForProductUseCase: ListReviewsForProductUseCase,
    private readonly markReviewVerifiedUseCase: MarkReviewVerifiedUseCase,
  ) {}

  @Get('products/:productId/reviews')
  @ApiOperation({ summary: 'List reviews for a product' })
  @ApiResponse({ status: 200, type: [ReviewResponseDto] })
  async listForProduct(@Param('productId') productId: string): Promise<ReviewResponseDto[]> {
    const reviews = await this.listReviewsForProductUseCase.execute(productId);
    return reviews.map(ReviewMapper.toResponseDto);
  }

  @Post('products/:productId/reviews')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('CLIENT')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Submit a review for a product' })
  @ApiResponse({ status: 201, type: ReviewResponseDto })
  async create(
    @Param('productId') productId: string,
    @Body() dto: CreateReviewDto,
    @CurrentUser() user: any,
  ): Promise<ReviewResponseDto> {
    const review = await this.createReviewUseCase.execute({
      customerId: user.customerId,
      productId,
      rating: dto.rating,
      comment: dto.comment,
    });
    return ReviewMapper.toResponseDto(review);
  }

  @Post('reviews/:id/verify')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('MANAGER', 'ADMIN')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Mark a review as verified' })
  @ApiResponse({ status: 200, type: ReviewResponseDto })
  async verify(@Param('id') id: string): Promise<ReviewResponseDto> {
    const review = await this.markReviewVerifiedUseCase.execute(id);
    return ReviewMapper.toResponseDto(review);
  }
}
