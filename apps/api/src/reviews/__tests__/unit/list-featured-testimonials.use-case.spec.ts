import { ListFeaturedTestimonialsUseCase } from '../../application/use-cases/list-featured-testimonials.use-case';
import { ITestimonialRepository } from '../../domain/repositories/testimonial.repository';
import { Testimonial } from '../../domain/entities/testimonial.entity';

describe('ListFeaturedTestimonialsUseCase', () => {
  let useCase: ListFeaturedTestimonialsUseCase;
  let mockRepository: jest.Mocked<ITestimonialRepository>;

  beforeEach(() => {
    mockRepository = {
      findFeatured: jest.fn().mockResolvedValue([
        new Testimonial('1', 'Alice', 'Robe de mariée', 'Superbe', true, true, new Date()),
      ]),
    };
    useCase = new ListFeaturedTestimonialsUseCase(mockRepository);
  });

  it('should return featured testimonials', async () => {
    const results = await useCase.execute(6);

    expect(results).toHaveLength(1);
    expect(results[0].customerName).toBe('Alice');
    expect(mockRepository.findFeatured).toHaveBeenCalledWith(6);
  });
});
