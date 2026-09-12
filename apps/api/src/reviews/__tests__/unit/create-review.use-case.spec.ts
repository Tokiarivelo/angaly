import { CreateReviewUseCase } from '../../application/use-cases/create-review.use-case';
import { IReviewRepository } from '../../domain/repositories/review.repository';
import { Review } from '../../domain/entities/review.entity';

describe('CreateReviewUseCase', () => {
  let useCase: CreateReviewUseCase;
  let mockRepository: jest.Mocked<IReviewRepository>;

  beforeEach(() => {
    mockRepository = {
      create: jest.fn().mockImplementation((review) => Promise.resolve(review)),
      findByProductId: jest.fn(),
      findById: jest.fn(),
      update: jest.fn(),
    };
    useCase = new CreateReviewUseCase(mockRepository);
  });

  it('should create a review with isVerified false', async () => {
    const result = await useCase.execute({
      customerId: 'customer-1',
      productId: 'product-1',
      rating: 4,
      comment: 'Great product!',
    });

    expect(result.isVerified).toBe(false);
    expect(result.rating).toBe(4);
    expect(result.comment).toBe('Great product!');
    expect(mockRepository.create).toHaveBeenCalledWith(expect.any(Review));
  });

  it('should throw an error for invalid ratings', async () => {
    await expect(
      useCase.execute({
        customerId: 'customer-1',
        productId: 'product-1',
        rating: 6,
      }),
    ).rejects.toThrow('Rating must be between 1 and 5');
  });
});
