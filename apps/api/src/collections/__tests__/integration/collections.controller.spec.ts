import type { Server } from 'node:http';

import type { INestApplication } from '@nestjs/common';
import { NotFoundException, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';

import { GetCollectionBySlugUseCase } from '../../application/use-cases/get-collection-by-slug.use-case';
import { ListCollectionsUseCase } from '../../application/use-cases/list-collections.use-case';
import { CollectionEntity } from '../../domain/entities/collection.entity';
import { CollectionsController } from '../../presentation/controllers/collections.controller';

function sampleCollection(): CollectionEntity {
  return CollectionEntity.create({
    id: 'collection-1',
    slug: 'eternelle',
    name: 'Éternelle',
    description: null,
    story: null,
    seasonYear: 2026,
    publishedAt: new Date('2020-01-01T00:00:00.000Z'),
    media: [],
    creationsCount: 2,
    creations: [{ id: 'creation-1', slug: 'robe-eternelle', name: 'Robe Éternelle', coverImageUrl: null }],
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  });
}

describe('CollectionsController (integration)', () => {
  let app: INestApplication;
  const listCollectionsUseCase = { execute: jest.fn() };
  const getCollectionBySlugUseCase = { execute: jest.fn() };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [CollectionsController],
      providers: [
        { provide: ListCollectionsUseCase, useValue: listCollectionsUseCase },
        { provide: GetCollectionBySlugUseCase, useValue: getCollectionBySlugUseCase },
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

  it('GET /collections returns a paginated response and never exposes a creations field', async () => {
    listCollectionsUseCase.execute.mockResolvedValue({ items: [sampleCollection()], total: 1 });

    const response = await request(server()).get('/collections').expect(200);

    expect(listCollectionsUseCase.execute).toHaveBeenCalledWith(
      expect.objectContaining({ page: 1, limit: 20, sort: 'publishedAt:desc' }),
    );
    const body = response.body as { data: Record<string, unknown>[]; meta: Record<string, unknown> };
    expect(body.data[0]).not.toHaveProperty('creations');
    expect(body.data[0]?.['creationsCount']).toBe(2);
    expect(body.meta).toEqual({
      total: 1,
      page: 1,
      limit: 20,
      totalPages: 1,
      hasNextPage: false,
      hasPreviousPage: false,
    });
  });

  it('GET /collections forwards seasonYear and sort filters', async () => {
    listCollectionsUseCase.execute.mockResolvedValue({ items: [], total: 0 });

    await request(server()).get('/collections').query({ seasonYear: 2026, sort: 'seasonYear:asc' }).expect(200);

    expect(listCollectionsUseCase.execute).toHaveBeenCalledWith(
      expect.objectContaining({ seasonYear: 2026, sort: 'seasonYear:asc' }),
    );
  });

  it('GET /collections rejects an invalid sort value with 400', async () => {
    await request(server()).get('/collections').query({ sort: 'name:asc' }).expect(400);
  });

  it('GET /collections/:slug returns the collection with its creations', async () => {
    getCollectionBySlugUseCase.execute.mockResolvedValue(sampleCollection());

    const response = await request(server()).get('/collections/eternelle').expect(200);

    expect(getCollectionBySlugUseCase.execute).toHaveBeenCalledWith('eternelle');
    const body = response.body as { slug: string; creations: unknown[] };
    expect(body.slug).toBe('eternelle');
    expect(body.creations).toHaveLength(1);
  });

  it('GET /collections/:slug returns 404 when the use-case throws NotFoundException', async () => {
    getCollectionBySlugUseCase.execute.mockRejectedValue(
      new NotFoundException('Collection with slug "missing" not found'),
    );

    await request(server()).get('/collections/missing').expect(404);
  });
});
