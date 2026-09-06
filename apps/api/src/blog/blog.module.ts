import { Module } from '@nestjs/common';

import { GetBlogPostBySlugUseCase } from './application/use-cases/get-blog-post-by-slug.use-case';
import { ListBlogPostsUseCase } from './application/use-cases/list-blog-posts.use-case';
import { ListRelatedPostsUseCase } from './application/use-cases/list-related-posts.use-case';
import { BLOG_POST_REPOSITORY } from './domain/repositories/blog-post.repository';
import { PrismaBlogPostRepository } from './infrastructure/repositories/prisma-blog-post.repository';
import { BlogPostsController } from './presentation/controllers/blog-posts.controller';

@Module({
  controllers: [BlogPostsController],
  providers: [
    ListBlogPostsUseCase,
    GetBlogPostBySlugUseCase,
    ListRelatedPostsUseCase,
    { provide: BLOG_POST_REPOSITORY, useClass: PrismaBlogPostRepository },
  ],
})
export class BlogModule {}
