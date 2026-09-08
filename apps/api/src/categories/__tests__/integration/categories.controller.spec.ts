import type { Server } from 'node:http';

import type { INestApplication } from '@nestjs/common';
import { ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';

import { CategoryEntity } from '../../domain/entities/category.entity';
import { ListCategoriesUseCase } from '../../application/use-cases/list-categories.use-case';
import { CategoriesController } from '../../presentation/controllers/categories.controller';

function sampleCategory(): CategoryEntity {
  return CategoryEntity.create({ id: 'cat-1', slug: 'robes-de-mariee', name: 'Robes de mariée', kind: 'CREATION' });
}

describe('CategoriesController (integration)', () => {
  let app: INestApplication;
  const listCategoriesUseCase = { execute: jest.fn() };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [CategoriesController],
      providers: [{ provide: ListCategoriesUseCase, useValue: listCategoriesUseCase }],
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

  it('GET /categories returns every category as a plain array when no kind is given', async () => {
    listCategoriesUseCase.execute.mockResolvedValue([sampleCategory()]);

    const response = await request(server()).get('/categories').expect(200);

    expect(listCategoriesUseCase.execute).toHaveBeenCalledWith(undefined);
    expect(response.body as unknown[]).toHaveLength(1);
  });

  it('GET /categories?kind=CREATION forwards the kind filter', async () => {
    listCategoriesUseCase.execute.mockResolvedValue([sampleCategory()]);

    const response = await request(server()).get('/categories').query({ kind: 'CREATION' }).expect(200);

    expect(listCategoriesUseCase.execute).toHaveBeenCalledWith('CREATION');
    const body = response.body as { kind: string }[];
    expect(body[0]?.kind).toBe('CREATION');
  });

  it('GET /categories?kind=INVALID rejects with 400', async () => {
    await request(server()).get('/categories').query({ kind: 'INVALID' }).expect(400);
  });
});
