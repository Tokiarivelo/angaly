import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ListFeaturedTestimonialsUseCase } from '../../application/use-cases/list-featured-testimonials.use-case';
import { TestimonialResponseDto } from '../../application/dtos/testimonial-response.dto';
import { TestimonialMapper } from '../../infrastructure/mappers/testimonial.mapper';

@ApiTags('Testimonials')
@Controller('testimonials')
export class TestimonialsController {
  constructor(
    private readonly listFeaturedTestimonialsUseCase: ListFeaturedTestimonialsUseCase,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List testimonials' })
  @ApiResponse({ status: 200, type: [TestimonialResponseDto] })
  async list(@Query('featured') featured?: string): Promise<TestimonialResponseDto[]> {
    if (featured === 'true') {
      const testimonials = await this.listFeaturedTestimonialsUseCase.execute();
      return testimonials.map(TestimonialMapper.toResponseDto);
    }
    // Only featured testimonials are exposed for now according to the spec
    return [];
  }
}
