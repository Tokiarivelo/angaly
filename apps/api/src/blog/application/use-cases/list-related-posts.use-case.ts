import { Inject, Injectable, NotFoundException } from '@nestjs/common';

import { BlogPostEntity } from '../../domain/entities/blog-post.entity';
import { BLOG_POST_REPOSITORY, IBlogPostRepository } from '../../domain/repositories/blog-post.repository';

const DEFAULT_LIMIT = 3;

@Injectable()
export class ListRelatedPostsUseCase {
  constructor(@Inject(BLOG_POST_REPOSITORY) private readonly blogPostRepository: IBlogPostRepository) {}

  async execute(slug: string, limit: number = DEFAULT_LIMIT): Promise<BlogPostEntity[]> {
    const post = await this.blogPostRepository.findPublishedBySlug(slug);
    if (!post) {
      throw new NotFoundException(`BlogPost with slug "${slug}" not found`);
    }
    return this.blogPostRepository.listRelated({ postId: post.id, categoryId: post.category.id, limit });
  }
}
