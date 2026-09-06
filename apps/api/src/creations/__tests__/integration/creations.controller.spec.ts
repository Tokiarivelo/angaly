import type { Server } from 'node:http';

import type { INestApplication } from '@nestjs/common';
import { NotFoundException, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';

import { GetCreationBySlugUseCase } from '../../application/use-cases/get-creation-by-slug.use-case';
import { ListCreationsUseCase } from '../../application/use-cases/list-creations.use-case';
import { CreationEntity } from '../../domain/entities/creation.entity';
import { CreationsController } from '../../presentation/controllers/creations.controller';

function sampleCreation(): CreationEntity {
  return CreationEntity.create({
    id: 'creation-1',
    slug: 'robe-eternelle',
    name: 'Robe Éternelle',
    description: 'Une robe intemporelle.',
    materials: null,
    techniques: null,
    availability: 'PIECE_UNIQUE',
    reproducible: true,
    isFeatured: false,
    featuredFrom: null,
    featuredUntil: null,
    category: { id: 'cat-1', slug: 'robes', name: 'Robes' },
    collection: null,
    media: [],
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  });
}

describe('CreationsController (integration)', () => {
  let app: INestApplication;
  const listCreationsUseCase = { execute: jest.fn() };
  const getCreationBySlugUseCase = { execute: jest.fn() };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [CreationsController],
      providers: [
        { provide: ListCreationsUseCase, useValue: listCreationsUseCase },
        { provide: GetCreationBySlugUseCase, useValue: getCreationBySlugUseCase },
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

  it('GET /creations returns a paginated response using default pagination', async () => {
    listCreationsUseCase.execute.mockResolvedValue({ items: [sampleCreation()], total: 1 });

    const response = await request(server()).get('/creations').expect(200);

    expect(listCreationsUseCase.execute).toHaveBeenCalledWith(expect.objectContaining({ page: 1, limit: 20 }));
    const body = response.body as { data: unknown[]; meta: Record<string, unknown> };
    expect(body.data).toHaveLength(1);
    expect(body.meta).toEqual({
      total: 1,
      page: 1,
      limit: 20,
      totalPages: 1,
      hasNextPage: false,
      hasPreviousPage: false,
    });
  });

  it('GET /creations forwards categoryId/collectionId/isFeatured/sort filters', async () => {
    listCreationsUseCase.execute.mockResolvedValue({ items: [], total: 0 });

    await request(server())
      .get('/creations')
      .query({ categoryId: 'cat-1', collectionId: 'coll-1', isFeatured: 'true', sort: 'featured' })
      .expect(200);

    expect(listCreationsUseCase.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        categoryId: 'cat-1',
        collectionId: 'coll-1',
        isFeatured: true,
        sort: 'featured',
      }),
    );
  });

  it('GET /creations rejects an invalid sort value with 400', async () => {
    await request(server()).get('/creations').query({ sort: 'oldest' }).expect(400);
  });

  it('GET /creations/:slug returns the creation', async () => {
    getCreationBySlugUseCase.execute.mockResolvedValue(sampleCreation());

    const response = await request(server()).get('/creations/robe-eternelle').expect(200);

    expect(getCreationBySlugUseCase.execute).toHaveBeenCalledWith('robe-eternelle');
    expect((response.body as { slug: string }).slug).toBe('robe-eternelle');
  });

  it('GET /creations/:slug returns 404 when the use-case throws NotFoundException', async () => {
    getCreationBySlugUseCase.execute.mockRejectedValue(new NotFoundException('Creation with slug "missing" not found'));

    await request(server()).get('/creations/missing').expect(404);
  });
});
