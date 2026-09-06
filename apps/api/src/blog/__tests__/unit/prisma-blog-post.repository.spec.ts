import type {
  BlogPostDetailRecord,
  BlogPostSummaryRecord} from '../../infrastructure/repositories/prisma-blog-post.repository';
import {
  PrismaBlogPostRepository,
} from '../../infrastructure/repositories/prisma-blog-post.repository';
import type { PrismaService } from '../../../prisma/prisma.service';

interface MockBlogPostDelegate {
  findFirst: jest.Mock;
  findMany: jest.Mock;
  count: jest.Mock;
}

function buildPrismaServiceMock(): { prisma: PrismaService; blogPost: MockBlogPostDelegate } {
  const blogPost: MockBlogPostDelegate = { findFirst: jest.fn(), findMany: jest.fn(), count: jest.fn() };
  const prisma = { blogPost } as unknown as PrismaService;
  return { prisma, blogPost };
}

function sampleSummary(): BlogPostSummaryRecord {
  return {
    id: 'post-1',
    slug: 'choisir-sa-robe-de-mariee',
    title: 'Choisir sa robe de mariée',
    excerpt: 'excerpt',
    publishedAt: new Date('2020-01-01T00:00:00.000Z'),
    createdAt: new Date(),
    updatedAt: new Date(),
    category: { id: 'cat-1', slug: 'conseils-mode', name: 'Conseils mode' },
    author: { id: 'user-1', email: 'redaction@angaly.mg' },
    media: [],
  };
}

function sampleDetail(): BlogPostDetailRecord {
  return { ...sampleSummary(), content: 'content' };
}

describe('PrismaBlogPostRepository', () => {
  it('findPublishedBySlug() returns null when no published row matches', async () => {
    const { prisma, blogPost } = buildPrismaServiceMock();
    blogPost.findFirst.mockResolvedValue(null);
    const repository = new PrismaBlogPostRepository(prisma);

    expect(await repository.findPublishedBySlug('missing')).toBeNull();
  });

  it('findPublishedBySlug() scopes the query to slug + published, loading the full content', async () => {
    const { prisma, blogPost } = buildPrismaServiceMock();
    blogPost.findFirst.mockResolvedValue(sampleDetail());
    const repository = new PrismaBlogPostRepository(prisma);

    const result = await repository.findPublishedBySlug('choisir-sa-robe-de-mariee');

    const call = blogPost.findFirst.mock.calls[0] as [
      { where: { slug: string; publishedAt: { not: null; lte: Date } }; select: { content: boolean } },
    ];
    expect(call[0].where.slug).toBe('choisir-sa-robe-de-mariee');
    expect(call[0].where.publishedAt.not).toBeNull();
    expect(call[0].select.content).toBe(true);
    expect(result?.content).toBe('content');
  });

  it('list() excludes unpublished rows and applies the categoryId filter', async () => {
    const { prisma, blogPost } = buildPrismaServiceMock();
    blogPost.findMany.mockResolvedValue([sampleSummary()]);
    blogPost.count.mockResolvedValue(1);
    const repository = new PrismaBlogPostRepository(prisma);

    const result = await repository.list({ categoryId: 'cat-1', page: 2, limit: 10 });

    const call = blogPost.findMany.mock.calls[0] as [
      { where: { categoryId: string; publishedAt: unknown }; skip: number; take: number },
    ];
    expect(call[0].where.categoryId).toBe('cat-1');
    expect(call[0].skip).toBe(10);
    expect(call[0].take).toBe(10);
    expect(result.total).toBe(1);
    expect(result.items[0]?.content).toBeNull();
  });

  it('listRelated() excludes the current post and scopes to the same category', async () => {
    const { prisma, blogPost } = buildPrismaServiceMock();
    blogPost.findMany.mockResolvedValue([sampleSummary()]);
    const repository = new PrismaBlogPostRepository(prisma);

    const result = await repository.listRelated({ postId: 'post-1', categoryId: 'cat-1', limit: 3 });

    const call = blogPost.findMany.mock.calls[0] as [
      { where: { categoryId: string; id: { not: string } }; take: number },
    ];
    expect(call[0].where.categoryId).toBe('cat-1');
    expect(call[0].where.id).toEqual({ not: 'post-1' });
    expect(call[0].take).toBe(3);
    expect(result).toHaveLength(1);
  });

  it('list() applies no categoryId filter when none is given', async () => {
    const { prisma, blogPost } = buildPrismaServiceMock();
    blogPost.findMany.mockResolvedValue([]);
    blogPost.count.mockResolvedValue(0);
    const repository = new PrismaBlogPostRepository(prisma);

    await repository.list({ page: 1, limit: 20 });

    const call = blogPost.findMany.mock.calls[0] as [{ where: Record<string, unknown> }];
    expect(call[0].where).not.toHaveProperty('categoryId');
  });
});
