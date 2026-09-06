import {
  BlogPostDetailResponseDto,
  BlogPostResponseDto,
} from '../../application/dtos/blog-post-response.dto';
import type { BlogPostProps } from '../../domain/entities/blog-post.entity';
import { BlogPostEntity } from '../../domain/entities/blog-post.entity';
import type {
  BlogPostDetailRecord,
  BlogPostSummaryRecord,
} from '../repositories/prisma-blog-post.repository';

function mapCommon(record: BlogPostSummaryRecord): Omit<BlogPostProps, 'content'> {
  return {
    id: record.id,
    slug: record.slug,
    title: record.title,
    excerpt: record.excerpt,
    publishedAt: record.publishedAt,
    category: record.category,
    author: record.author,
    media: record.media.map((media) => ({ ...media, altText: media.altText ?? '' })),
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}

export class BlogPostMapper {
  static toDomainSummary(record: BlogPostSummaryRecord): BlogPostEntity {
    return BlogPostEntity.create({ ...mapCommon(record), content: null });
  }

  static toDomainDetail(record: BlogPostDetailRecord): BlogPostEntity {
    return BlogPostEntity.create({ ...mapCommon(record), content: record.content });
  }

  static toResponseDto(entity: BlogPostEntity): BlogPostResponseDto {
    const dto = new BlogPostResponseDto();
    dto.id = entity.id;
    dto.slug = entity.slug;
    dto.title = entity.title;
    dto.excerpt = entity.excerpt;
    dto.publishedAt = entity.publishedAt?.toISOString() ?? null;
    dto.category = entity.category;
    dto.author = entity.author;
    dto.media = entity.media;
    dto.createdAt = entity.createdAt.toISOString();
    dto.updatedAt = entity.updatedAt.toISOString();
    return dto;
  }

  static toDetailResponseDto(entity: BlogPostEntity): BlogPostDetailResponseDto {
    const dto = new BlogPostDetailResponseDto();
    Object.assign(dto, this.toResponseDto(entity));
    dto.content = entity.content ?? '';
    return dto;
  }
}
