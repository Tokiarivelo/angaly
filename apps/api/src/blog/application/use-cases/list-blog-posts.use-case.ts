import { Inject, Injectable } from '@nestjs/common';

import {
  BLOG_POST_REPOSITORY,
  BlogPostListFilter,
  BlogPostListResult,
  IBlogPostRepository,
} from '../../domain/repositories/blog-post.repository';

@Injectable()
export class ListBlogPostsUseCase {
  constructor(@Inject(BLOG_POST_REPOSITORY) private readonly blogPostRepository: IBlogPostRepository) {}

  execute(filter: BlogPostListFilter): Promise<BlogPostListResult> {
    return this.blogPostRepository.list(filter);
  }
}
