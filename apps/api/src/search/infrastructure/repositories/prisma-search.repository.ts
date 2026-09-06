import { Injectable } from '@nestjs/common';
import { Prisma } from '@angaly/database';

import { PrismaService } from '../../../prisma/prisma.service';
import { GroupedSearchResults, ISearchRepository } from '../../domain/repositories/search.repository';
import { SearchResultMapper, SearchRawRow } from '../mappers/search-result.mapper';

const EXCERPT_MAX_LENGTH = 200;

/**
 * Every WHERE/LIMIT value below is passed through a `Prisma.sql` tagged-template
 * interpolation (`${...}`), which Prisma turns into a parameterized placeholder —
 * never string concatenation. See docs/features/search.md "Points d'attention"
 * (spec §75, SQL injection).
 */

function creationsQuery(query: string, limit: number): Prisma.Sql {
  return Prisma.sql`
    SELECT c.id, c.slug, c.name AS title, LEFT(c.description, ${EXCERPT_MAX_LENGTH}::integer) AS excerpt,
      (SELECT m.url FROM media m WHERE m."entityType" = 'CREATION' AND m."entityId" = c.id ORDER BY m."sortOrder" ASC LIMIT 1) AS "imageUrl"
    FROM creations c
    WHERE to_tsvector('french', c.name || ' ' || c.description) @@ plainto_tsquery('french', ${query})
    ORDER BY ts_rank(to_tsvector('french', c.name || ' ' || c.description), plainto_tsquery('french', ${query})) DESC
    LIMIT ${limit}::integer
  `;
}

function productsQuery(query: string, limit: number): Prisma.Sql {
  return Prisma.sql`
    SELECT p.id, p.slug, p.name AS title, LEFT(p.description, ${EXCERPT_MAX_LENGTH}::integer) AS excerpt,
      (SELECT m.url FROM media m WHERE m."entityType" = 'PRODUCT' AND m."entityId" = p.id ORDER BY m."sortOrder" ASC LIMIT 1) AS "imageUrl"
    FROM products p
    WHERE to_tsvector('french', p.name || ' ' || p.description) @@ plainto_tsquery('french', ${query})
    ORDER BY ts_rank(to_tsvector('french', p.name || ' ' || p.description), plainto_tsquery('french', ${query})) DESC
    LIMIT ${limit}::integer
  `;
}

function collectionsQuery(query: string, limit: number): Prisma.Sql {
  return Prisma.sql`
    SELECT col.id, col.slug, col.name AS title,
      LEFT(coalesce(col.description, col.story, ''), ${EXCERPT_MAX_LENGTH}::integer) AS excerpt,
      (SELECT m.url FROM media m WHERE m."entityType" = 'COLLECTION' AND m."entityId" = col.id ORDER BY m."sortOrder" ASC LIMIT 1) AS "imageUrl"
    FROM collections col
    WHERE col."publishedAt" IS NOT NULL AND col."publishedAt" <= now()
      AND to_tsvector('french', col.name || ' ' || coalesce(col.description, '') || ' ' || coalesce(col.story, ''))
        @@ plainto_tsquery('french', ${query})
    ORDER BY ts_rank(
      to_tsvector('french', col.name || ' ' || coalesce(col.description, '') || ' ' || coalesce(col.story, '')),
      plainto_tsquery('french', ${query})
    ) DESC
    LIMIT ${limit}::integer
  `;
}

function blogPostsQuery(query: string, limit: number): Prisma.Sql {
  return Prisma.sql`
    SELECT bp.id, bp.slug, bp.title AS title, LEFT(bp.excerpt, ${EXCERPT_MAX_LENGTH}::integer) AS excerpt,
      (SELECT m.url FROM media m WHERE m."entityType" = 'BLOG_POST' AND m."entityId" = bp.id ORDER BY m."sortOrder" ASC LIMIT 1) AS "imageUrl"
    FROM blog_posts bp
    WHERE bp."publishedAt" IS NOT NULL AND bp."publishedAt" <= now()
      AND to_tsvector('french', bp.title || ' ' || bp.excerpt || ' ' || bp.content) @@ plainto_tsquery('french', ${query})
    ORDER BY ts_rank(
      to_tsvector('french', bp.title || ' ' || bp.excerpt || ' ' || bp.content),
      plainto_tsquery('french', ${query})
    ) DESC
    LIMIT ${limit}::integer
  `;
}

function ateliersQuery(query: string, limit: number): Prisma.Sql {
  return Prisma.sql`
    SELECT a.id, a.slug, a.name AS title, LEFT(a.address || ', ' || a.city, ${EXCERPT_MAX_LENGTH}::integer) AS excerpt,
      (SELECT m.url FROM media m WHERE m."entityType" = 'ATELIER' AND m."entityId" = a.id ORDER BY m."sortOrder" ASC LIMIT 1) AS "imageUrl"
    FROM ateliers a
    WHERE to_tsvector('french', a.name || ' ' || a.city || ' ' || a.address) @@ plainto_tsquery('french', ${query})
    ORDER BY ts_rank(to_tsvector('french', a.name || ' ' || a.city || ' ' || a.address), plainto_tsquery('french', ${query})) DESC
    LIMIT ${limit}::integer
  `;
}

@Injectable()
export class PrismaSearchRepository implements ISearchRepository {
  constructor(private readonly prisma: PrismaService) {}

  async search(query: string, limitPerType: number): Promise<GroupedSearchResults> {
    const [creations, products, collections, blogPosts, ateliers] = await Promise.all([
      this.prisma.$queryRaw<SearchRawRow[]>(creationsQuery(query, limitPerType)),
      this.prisma.$queryRaw<SearchRawRow[]>(productsQuery(query, limitPerType)),
      this.prisma.$queryRaw<SearchRawRow[]>(collectionsQuery(query, limitPerType)),
      this.prisma.$queryRaw<SearchRawRow[]>(blogPostsQuery(query, limitPerType)),
      this.prisma.$queryRaw<SearchRawRow[]>(ateliersQuery(query, limitPerType)),
    ]);

    return {
      creations: creations.map((row) => SearchResultMapper.toDomain(row, 'CREATION')),
      products: products.map((row) => SearchResultMapper.toDomain(row, 'PRODUCT')),
      collections: collections.map((row) => SearchResultMapper.toDomain(row, 'COLLECTION')),
      blogPosts: blogPosts.map((row) => SearchResultMapper.toDomain(row, 'BLOG_POST')),
      ateliers: ateliers.map((row) => SearchResultMapper.toDomain(row, 'ATELIER')),
    };
  }
}
