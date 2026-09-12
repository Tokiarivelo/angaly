import { Testimonial } from '../entities/testimonial.entity';

export interface ITestimonialRepository {
  findFeatured(limit?: number): Promise<Testimonial[]>;
}
