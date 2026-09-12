import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { ITestimonialRepository } from '../../domain/repositories/testimonial.repository';
import { Testimonial } from '../../domain/entities/testimonial.entity';
import { TestimonialMapper } from '../mappers/testimonial.mapper';

@Injectable()
export class PrismaTestimonialRepository implements ITestimonialRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findFeatured(limit: number = 6): Promise<Testimonial[]> {
    const prismaTestimonials = await this.prisma.testimonial.findMany({
      where: { isPublished: true },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        media: {
          orderBy: { sortOrder: 'asc' },
        },
      },
    });

    return prismaTestimonials.map(TestimonialMapper.toDomain);
  }
}
