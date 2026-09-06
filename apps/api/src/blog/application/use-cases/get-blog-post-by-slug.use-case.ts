import { Inject, Injectable, NotFoundException } from '@nestjs/common';

import { BlogPostEntity } from '../../domain/entities/blog-post.entity';
import { BLOG_POST_REPOSITORY, IBlogPostRepository } from '../../domain/repositories/blog-post.repository';

@Injectable()
export class GetBlogPostBySlugUseCase {
  constructor(@Inject(BLOG_POST_REPOSITORY) private readonly blogPostRepository: IBlogPostRepository) {}

  async execute(slug: string): Promise<BlogPostEntity> {
    const post = await this.blogPostRepository.findPublishedBySlug(slug);
    if (!post) {
      throw new NotFoundException(`BlogPost with slug "${slug}" not found`);
    }
    return post;
  }
}
