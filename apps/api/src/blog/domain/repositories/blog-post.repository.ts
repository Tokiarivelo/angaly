import type { BlogPostEntity } from '../entities/blog-post.entity';

export const BLOG_POST_REPOSITORY = Symbol('IBlogPostRepository');

export interface BlogPostListFilter {
  categoryId?: string;
  page: number;
  limit: number;
}

export interface BlogPostListResult {
  items: BlogPostEntity[];
  total: number;
}

export interface RelatedBlogPostsParams {
  postId: string;
  categoryId: string;
  limit: number;
}

export interface IBlogPostRepository {
  /** Excludes unpublished posts — never surfaced on public endpoints (Phase 1 has no admin preview). Loads the full body. */
  findPublishedBySlug: (slug: string) => Promise<BlogPostEntity | null>;
  /** Summary rows (no body) — for cards. */
  list: (filter: BlogPostListFilter) => Promise<BlogPostListResult>;
  /** Same category, current post excluded, published only, capped at `limit`. */
  listRelated: (params: RelatedBlogPostsParams) => Promise<BlogPostEntity[]>;
}
