import type { Prisma } from '@angaly/database';

import { PrismaSearchRepository } from '../../infrastructure/repositories/prisma-search.repository';
import type { PrismaService } from '../../../prisma/prisma.service';

type QueryRawMock = jest.Mock<Promise<unknown[]>, [Prisma.Sql]>;

function buildPrismaServiceMock(): { prisma: PrismaService; queryRaw: QueryRawMock } {
  const queryRaw = jest.fn<Promise<unknown[]>, [Prisma.Sql]>().mockResolvedValue([]);
  const prisma = { $queryRaw: queryRaw } as unknown as PrismaService;
  return { prisma, queryRaw };
}

describe('PrismaSearchRepository', () => {
  it('queries all 5 entities in parallel and groups results by type', async () => {
    const { prisma, queryRaw } = buildPrismaServiceMock();
    queryRaw
      .mockResolvedValueOnce([{ id: 'c1', slug: 's1', title: 't1', excerpt: 'e1', imageUrl: null }])
      .mockResolvedValueOnce([{ id: 'p1', slug: 's2', title: 't2', excerpt: 'e2', imageUrl: null }])
      .mockResolvedValueOnce([{ id: 'col1', slug: 's3', title: 't3', excerpt: 'e3', imageUrl: null }])
      .mockResolvedValueOnce([{ id: 'bp1', slug: 's4', title: 't4', excerpt: 'e4', imageUrl: null }])
      .mockResolvedValueOnce([{ id: 'at1', slug: 's5', title: 't5', excerpt: 'e5', imageUrl: null }]);
    const repository = new PrismaSearchRepository(prisma);

    const result = await repository.search('robe', 5);

    expect(queryRaw).toHaveBeenCalledTimes(5);
    expect(result.creations).toHaveLength(1);
    expect(result.creations[0]?.type).toBe('CREATION');
    expect(result.products).toHaveLength(1);
    expect(result.products[0]?.type).toBe('PRODUCT');
    expect(result.collections).toHaveLength(1);
    expect(result.collections[0]?.type).toBe('COLLECTION');
    expect(result.blogPosts).toHaveLength(1);
    expect(result.blogPosts[0]?.type).toBe('BLOG_POST');
    expect(result.ateliers).toHaveLength(1);
    expect(result.ateliers[0]?.type).toBe('ATELIER');
  });

  it('parameterizes every query — the search term and limit never appear as literals in the SQL text', async () => {
    const { prisma, queryRaw } = buildPrismaServiceMock();
    const repository = new PrismaSearchRepository(prisma);

    await repository.search("robe'; DROP TABLE creations; --", 7);

    for (const call of queryRaw.mock.calls) {
      const sqlArg = call[0];
      expect(sqlArg.sql).not.toContain('DROP TABLE');
      expect(sqlArg.sql).not.toContain("robe'");
      expect(sqlArg.values).toContain("robe'; DROP TABLE creations; --");
      expect(sqlArg.values).toContain(7);
    }
  });

  it('scopes the collections and blog-post queries to published rows only', async () => {
    const { prisma, queryRaw } = buildPrismaServiceMock();
    const repository = new PrismaSearchRepository(prisma);

    await repository.search('robe', 5);

    const [, , collectionsCall, blogPostsCall] = queryRaw.mock.calls as [unknown, unknown, [Prisma.Sql], [Prisma.Sql]];
    expect(collectionsCall[0].sql).toContain('"publishedAt" IS NOT NULL');
    expect(blogPostsCall[0].sql).toContain('"publishedAt" IS NOT NULL');
  });
});
