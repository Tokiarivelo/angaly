import { ApiProperty } from '@nestjs/swagger';
import {
  BlogPostAuthorDto as SharedBlogPostAuthorDto,
  BlogPostCategoryDto as SharedBlogPostCategoryDto,
  BlogPostDetailDto,
  BlogPostDto,
  BlogPostMediaDto as SharedBlogPostMediaDto,
  PaginatedResponse,
} from '@angaly/types';

export class BlogPostMediaDto implements SharedBlogPostMediaDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  url!: string;

  @ApiProperty()
  altText!: string;

  @ApiProperty()
  sortOrder!: number;
}

export class BlogPostCategoryDto implements SharedBlogPostCategoryDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  slug!: string;

  @ApiProperty()
  name!: string;
}

export class BlogPostAuthorDto implements SharedBlogPostAuthorDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  email!: string;
}

/** Shape returned by GET /api/blog-posts and /api/blog-posts/:slug/related — no article body. */
export class BlogPostResponseDto implements BlogPostDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  slug!: string;

  @ApiProperty()
  title!: string;

  @ApiProperty()
  excerpt!: string;

  @ApiProperty({ nullable: true })
  publishedAt!: string | null;

  @ApiProperty({ type: BlogPostCategoryDto })
  category!: BlogPostCategoryDto;

  @ApiProperty({ type: BlogPostAuthorDto })
  author!: BlogPostAuthorDto;

  @ApiProperty({ type: [BlogPostMediaDto] })
  media!: BlogPostMediaDto[];

  @ApiProperty()
  createdAt!: string;

  @ApiProperty()
  updatedAt!: string;
}

/** Shape returned by GET /api/blog-posts/:slug — adds the full article body. */
export class BlogPostDetailResponseDto extends BlogPostResponseDto implements BlogPostDetailDto {
  @ApiProperty()
  content!: string;
}

export class PaginatedBlogPostResponseDto implements PaginatedResponse<BlogPostResponseDto> {
  @ApiProperty({ type: [BlogPostResponseDto] })
  data!: BlogPostResponseDto[];

  @ApiProperty()
  meta!: PaginatedResponse<BlogPostResponseDto>['meta'];
}
