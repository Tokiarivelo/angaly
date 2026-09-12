import { Inject, Injectable } from '@nestjs/common';
import { ITestimonialRepository } from '../../domain/repositories/testimonial.repository';
import { Testimonial } from '../../domain/entities/testimonial.entity';

@Injectable()
export class ListFeaturedTestimonialsUseCase {
  constructor(
    @Inject('ITestimonialRepository')
    private readonly testimonialRepository: ITestimonialRepository,
  ) {}

  async execute(limit: number = 6): Promise<Testimonial[]> {
    return this.testimonialRepository.findFeatured(limit);
  }
}
