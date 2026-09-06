import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { PaginatedResponse } from '@angaly/types';

import {
  BlogPostDetailResponseDto,
  BlogPostResponseDto,
  PaginatedBlogPostResponseDto,
} from '../../application/dtos/blog-post-response.dto';
import { ListBlogPostsQueryDto } from '../../application/dtos/list-blog-posts-query.dto';
import { ListRelatedPostsQueryDto } from '../../application/dtos/list-related-posts-query.dto';
import { GetBlogPostBySlugUseCase } from '../../application/use-cases/get-blog-post-by-slug.use-case';
import { ListBlogPostsUseCase } from '../../application/use-cases/list-blog-posts.use-case';
import { ListRelatedPostsUseCase } from '../../application/use-cases/list-related-posts.use-case';
import { BlogPostMapper } from '../../infrastructure/mappers/blog-post.mapper';

@ApiTags('Blog')
@Controller('blog-posts')
export class BlogPostsController {
  constructor(
    private readonly listBlogPostsUseCase: ListBlogPostsUseCase,
    private readonly getBlogPostBySlugUseCase: GetBlogPostBySlugUseCase,
    private readonly listRelatedPostsUseCase: ListRelatedPostsUseCase,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List published blog posts, filtered by categoryId, paginated (no article body)' })
  @ApiResponse({ status: 200, type: PaginatedBlogPostResponseDto })
  async list(@Query() query: ListBlogPostsQueryDto): Promise<PaginatedResponse<BlogPostResponseDto>> {
    const { items, total } = await this.listBlogPostsUseCase.execute(query);
    const totalPages = Math.max(1, Math.ceil(total / query.limit));

    return {
      data: items.map((item) => BlogPostMapper.toResponseDto(item)),
      meta: {
        total,
        page: query.page,
        limit: query.limit,
        totalPages,
        hasNextPage: query.page < totalPages,
        hasPreviousPage: query.page > 1,
      },
    };
  }

  @Get(':slug')
  @ApiOperation({ summary: 'Get a published blog post by slug, with its full body' })
  @ApiResponse({ status: 200, type: BlogPostDetailResponseDto })
  async getBySlug(@Param('slug') slug: string): Promise<BlogPostDetailResponseDto> {
    const post = await this.getBlogPostBySlugUseCase.execute(slug);
    return BlogPostMapper.toDetailResponseDto(post);
  }

  @Get(':slug/related')
  @ApiOperation({ summary: 'Suggest posts from the same category, excluding the current one' })
  @ApiResponse({ status: 200, type: [BlogPostResponseDto] })
  async listRelated(
    @Param('slug') slug: string,
    @Query() query: ListRelatedPostsQueryDto,
  ): Promise<BlogPostResponseDto[]> {
    const posts = await this.listRelatedPostsUseCase.execute(slug, query.limit);
    return posts.map((post) => BlogPostMapper.toResponseDto(post));
  }
}
