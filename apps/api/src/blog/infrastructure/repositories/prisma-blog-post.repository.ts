import { Injectable } from '@nestjs/common';
import { Prisma } from '@angaly/database';

import { PrismaService } from '../../../prisma/prisma.service';
import { BlogPostEntity } from '../../domain/entities/blog-post.entity';
import {
  BlogPostListFilter,
  BlogPostListResult,
  IBlogPostRepository,
  RelatedBlogPostsParams,
} from '../../domain/repositories/blog-post.repository';
import { BlogPostMapper } from '../mappers/blog-post.mapper';

export const BLOG_POST_SUMMARY_SELECT = {
  id: true,
  slug: true,
  title: true,
  excerpt: true,
  publishedAt: true,
  createdAt: true,
  updatedAt: true,
  category: { select: { id: true, slug: true, name: true } },
  author: { select: { id: true, email: true } },
  media: {
    orderBy: { sortOrder: 'asc' },
    select: { id: true, url: true, altText: true, sortOrder: true },
  },
} satisfies Prisma.BlogPostSelect;

export type BlogPostSummaryRecord = Prisma.BlogPostGetPayload<{ select: typeof BLOG_POST_SUMMARY_SELECT }>;

export const BLOG_POST_DETAIL_SELECT = {
  ...BLOG_POST_SUMMARY_SELECT,
  content: true,
} satisfies Prisma.BlogPostSelect;

export type BlogPostDetailRecord = Prisma.BlogPostGetPayload<{ select: typeof BLOG_POST_DETAIL_SELECT }>;

function publishedWhere(): Prisma.BlogPostWhereInput {
  return { publishedAt: { not: null, lte: new Date() } };
}

@Injectable()
export class PrismaBlogPostRepository implements IBlogPostRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findPublishedBySlug(slug: string): Promise<BlogPostEntity | null> {
    const record = await this.prisma.blogPost.findFirst({
      where: { slug, ...publishedWhere() },
      select: BLOG_POST_DETAIL_SELECT,
    });
    return record ? BlogPostMapper.toDomainDetail(record) : null;
  }

  async list(filter: BlogPostListFilter): Promise<BlogPostListResult> {
    const where: Prisma.BlogPostWhereInput = {
      ...publishedWhere(),
      ...(filter.categoryId ? { categoryId: filter.categoryId } : {}),
    };

    const [records, total] = await Promise.all([
      this.prisma.blogPost.findMany({
        where,
        select: BLOG_POST_SUMMARY_SELECT,
        orderBy: [{ publishedAt: 'desc' }],
        skip: (filter.page - 1) * filter.limit,
        take: filter.limit,
      }),
      this.prisma.blogPost.count({ where }),
    ]);

    return { items: records.map((record) => BlogPostMapper.toDomainSummary(record)), total };
  }

  async listRelated({ postId, categoryId, limit }: RelatedBlogPostsParams): Promise<BlogPostEntity[]> {
    const records = await this.prisma.blogPost.findMany({
      where: { ...publishedWhere(), categoryId, id: { not: postId } },
      select: BLOG_POST_SUMMARY_SELECT,
      orderBy: [{ publishedAt: 'desc' }],
      take: limit,
    });
    return records.map((record) => BlogPostMapper.toDomainSummary(record));
  }
}
