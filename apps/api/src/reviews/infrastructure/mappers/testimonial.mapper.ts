import { Testimonial as PrismaTestimonial, Media as PrismaMedia } from '@angaly/database';
import { Testimonial } from '../../domain/entities/testimonial.entity';
import { TestimonialResponseDto } from '../../application/dtos/testimonial-response.dto';
import { MediaMapper } from '../../../media/infrastructure/mappers/media.mapper';

type PrismaTestimonialWithMedia = PrismaTestimonial & { media?: PrismaMedia[] };

export class TestimonialMapper {
  static toDomain(prismaTestimonial: PrismaTestimonialWithMedia): Testimonial {
    const media = prismaTestimonial.media ? prismaTestimonial.media.map(MediaMapper.toDomain) : [];
    
    return new Testimonial(
      prismaTestimonial.id,
      prismaTestimonial.customerName,
      prismaTestimonial.creationLabel,
      prismaTestimonial.quote,
      prismaTestimonial.isVerified,
      prismaTestimonial.isPublished,
      prismaTestimonial.createdAt,
      media,
    );
  }

  static toResponseDto(testimonial: Testimonial): TestimonialResponseDto {
    const mediaUrl = testimonial.media.length > 0 ? testimonial.media[0].url : null;
    
    return {
      id: testimonial.id,
      customerName: testimonial.customerName,
      clientName: testimonial.customerName,
      creationLabel: testimonial.creationLabel,
      quote: testimonial.quote,
      isVerified: testimonial.isVerified,
      verified: testimonial.isVerified,
      mediaUrl,
      avatarUrl: mediaUrl,
      createdAt: testimonial.createdAt.toISOString(),
      updatedAt: testimonial.createdAt.toISOString(), // Testimonials don't have updatedAt in Prisma, fallback to createdAt
    };
  }
}
