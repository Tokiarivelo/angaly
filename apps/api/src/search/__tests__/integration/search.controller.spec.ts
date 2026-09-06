import type { Server } from 'node:http';

import type { INestApplication } from '@nestjs/common';
import { BadRequestException, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';

import { GlobalSearchUseCase } from '../../application/use-cases/global-search.use-case';
import { SearchController } from '../../presentation/controllers/search.controller';

const EMPTY_RESULTS = { creations: [], products: [], collections: [], blogPosts: [], ateliers: [] };

describe('SearchController (integration)', () => {
  let app: INestApplication;
  const globalSearchUseCase = { execute: jest.fn() };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [SearchController],
      providers: [{ provide: GlobalSearchUseCase, useValue: globalSearchUseCase }],
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

  it('GET /search?q= returns grouped results', async () => {
    const item = (type: string, id: string) => ({ type, id, slug: id, title: id, excerpt: 'e', imageUrl: null });
    globalSearchUseCase.execute.mockResolvedValue({
      creations: [item('CREATION', 'c1')],
      products: [item('PRODUCT', 'p1')],
      collections: [item('COLLECTION', 'col1')],
      blogPosts: [item('BLOG_POST', 'bp1')],
      ateliers: [item('ATELIER', 'at1')],
    });

    const response = await request(server()).get('/search').query({ q: 'robe' }).expect(200);

    expect(globalSearchUseCase.execute).toHaveBeenCalledWith('robe', 5);
    const body = response.body as Record<string, unknown[]>;
    expect(body.creations).toHaveLength(1);
    expect(body.products).toHaveLength(1);
    expect(body.collections).toHaveLength(1);
    expect(body.blogPosts).toHaveLength(1);
    expect(body.ateliers).toHaveLength(1);
  });

  it('GET /search forwards a custom limitPerType', async () => {
    globalSearchUseCase.execute.mockResolvedValue(EMPTY_RESULTS);

    await request(server()).get('/search').query({ q: 'robe', limitPerType: 10 }).expect(200);

    expect(globalSearchUseCase.execute).toHaveBeenCalledWith('robe', 10);
  });

  it('GET /search without q rejects with 400 (missing required field)', async () => {
    await request(server()).get('/search').expect(400);

    expect(globalSearchUseCase.execute).not.toHaveBeenCalled();
  });

  it('GET /search returns 400 when the use-case rejects a too-short query', async () => {
    globalSearchUseCase.execute.mockRejectedValue(new BadRequestException('Search query must be at least 2 characters'));

    await request(server()).get('/search').query({ q: 'r' }).expect(400);
  });
});
