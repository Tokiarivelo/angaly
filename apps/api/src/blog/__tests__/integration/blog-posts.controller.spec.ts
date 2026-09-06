import type { Server } from 'node:http';

import type { INestApplication } from '@nestjs/common';
import { NotFoundException, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';

import { GetBlogPostBySlugUseCase } from '../../application/use-cases/get-blog-post-by-slug.use-case';
import { ListBlogPostsUseCase } from '../../application/use-cases/list-blog-posts.use-case';
import { ListRelatedPostsUseCase } from '../../application/use-cases/list-related-posts.use-case';
import { BlogPostEntity } from '../../domain/entities/blog-post.entity';
import { BlogPostsController } from '../../presentation/controllers/blog-posts.controller';

function samplePost(overrides: Partial<Parameters<typeof BlogPostEntity.create>[0]> = {}): BlogPostEntity {
  return BlogPostEntity.create({
    id: 'post-1',
    slug: 'choisir-sa-robe-de-mariee',
    title: 'Choisir sa robe de mariée',
    excerpt: 'Nos conseils.',
    content: '<p>Contenu complet</p>',
    publishedAt: new Date('2020-01-01T00:00:00.000Z'),
    category: { id: 'cat-1', slug: 'conseils-mode', name: 'Conseils mode' },
    author: { id: 'user-1', email: 'redaction@angaly.mg' },
    media: [],
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    ...overrides,
  });
}

describe('BlogPostsController (integration)', () => {
  let app: INestApplication;
  const listBlogPostsUseCase = { execute: jest.fn() };
  const getBlogPostBySlugUseCase = { execute: jest.fn() };
  const listRelatedPostsUseCase = { execute: jest.fn() };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [BlogPostsController],
      providers: [
        { provide: ListBlogPostsUseCase, useValue: listBlogPostsUseCase },
        { provide: GetBlogPostBySlugUseCase, useValue: getBlogPostBySlugUseCase },
        { provide: ListRelatedPostsUseCase, useValue: listRelatedPostsUseCase },
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  function server(): Server {
    return app.getHttpServer() as Server;
  }

  it('GET /blog-posts returns a paginated response and never exposes a content field', async () => {
    listBlogPostsUseCase.execute.mockResolvedValue({ items: [samplePost()], total: 1 });

    const response = await request(server()).get('/blog-posts').expect(200);

    expect(listBlogPostsUseCase.execute).toHaveBeenCalledWith(expect.objectContaining({ page: 1, limit: 20 }));
    const body = response.body as { data: Record<string, unknown>[]; meta: Record<string, unknown> };
    expect(body.data[0]).not.toHaveProperty('content');
    expect(body.meta).toEqual({
      total: 1,
      page: 1,
      limit: 20,
      totalPages: 1,
      hasNextPage: false,
      hasPreviousPage: false,
    });
  });

  it('GET /blog-posts forwards the categoryId filter', async () => {
    listBlogPostsUseCase.execute.mockResolvedValue({ items: [], total: 0 });

    await request(server()).get('/blog-posts').query({ categoryId: 'cat-1' }).expect(200);

    expect(listBlogPostsUseCase.execute).toHaveBeenCalledWith(expect.objectContaining({ categoryId: 'cat-1' }));
  });

  it('GET /blog-posts/:slug returns the post with its full content', async () => {
    getBlogPostBySlugUseCase.execute.mockResolvedValue(samplePost());

    const response = await request(server()).get('/blog-posts/choisir-sa-robe-de-mariee').expect(200);

    expect(getBlogPostBySlugUseCase.execute).toHaveBeenCalledWith('choisir-sa-robe-de-mariee');
    const body = response.body as { content: string };
    expect(body.content).toBe('<p>Contenu complet</p>');
  });

  it('GET /blog-posts/:slug returns 404 when the use-case throws NotFoundException', async () => {
    getBlogPostBySlugUseCase.execute.mockRejectedValue(
      new NotFoundException('BlogPost with slug "missing" not found'),
    );

    await request(server()).get('/blog-posts/missing').expect(404);
  });

  it('GET /blog-posts/:slug/related returns related posts, defaulting limit to 3', async () => {
    listRelatedPostsUseCase.execute.mockResolvedValue([samplePost({ id: 'post-2', slug: 'autre-article' })]);

    const response = await request(server()).get('/blog-posts/choisir-sa-robe-de-mariee/related').expect(200);

    expect(listRelatedPostsUseCase.execute).toHaveBeenCalledWith('choisir-sa-robe-de-mariee', 3);
    expect((response.body as unknown[])).toHaveLength(1);
  });

  it('GET /blog-posts/:slug/related forwards a custom limit', async () => {
    listRelatedPostsUseCase.execute.mockResolvedValue([]);

    await request(server()).get('/blog-posts/choisir-sa-robe-de-mariee/related').query({ limit: 5 }).expect(200);

    expect(listRelatedPostsUseCase.execute).toHaveBeenCalledWith('choisir-sa-robe-de-mariee', 5);
  });

  it('GET /blog-posts/:slug/related returns 404 when the current post does not exist', async () => {
    listRelatedPostsUseCase.execute.mockRejectedValue(new NotFoundException('BlogPost with slug "missing" not found'));

    await request(server()).get('/blog-posts/missing/related').expect(404);
  });
});
