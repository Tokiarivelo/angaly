import type { Server } from 'node:http';

import type { INestApplication } from '@nestjs/common';
import { NotFoundException, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';

import { ProductEntity } from '../../domain/entities/product.entity';
import { GetProductBySlugUseCase } from '../../application/use-cases/get-product-by-slug.use-case';
import { ListProductsUseCase } from '../../application/use-cases/list-products.use-case';
import { ListSimilarProductsUseCase } from '../../application/use-cases/list-similar-products.use-case';
import { ProductsController } from '../../presentation/controllers/products.controller';

function sampleProduct(): ProductEntity {
  return ProductEntity.create({
    id: 'product-1',
    sku: 'ROB-001',
    slug: 'robe-cocktail',
    name: 'Robe Cocktail',
    description: 'Une robe de cocktail.',
    price: { amount: '150000.00', currency: 'MGA' },
    status: 'AVAILABLE',
    category: { id: 'cat-1', slug: 'robes', name: 'Robes' },
    media: [],
    variants: [],
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  });
}

describe('ProductsController (integration)', () => {
  let app: INestApplication;
  const listProductsUseCase = { execute: jest.fn() };
  const listSimilarProductsUseCase = { execute: jest.fn() };
  const getProductBySlugUseCase = { execute: jest.fn() };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [ProductsController],
      providers: [
        { provide: ListProductsUseCase, useValue: listProductsUseCase },
        { provide: ListSimilarProductsUseCase, useValue: listSimilarProductsUseCase },
        { provide: GetProductBySlugUseCase, useValue: getProductBySlugUseCase },
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

  describe('GET /products', () => {
    it('returns a paginated list', async () => {
      listProductsUseCase.execute.mockResolvedValue({ items: [sampleProduct()], total: 1 });

      const response = await request(server()).get('/products').query({ categoryId: 'cat-1' }).expect(200);

      const body = response.body as { data: Array<{ slug: string }>; meta: { total: number } };
      expect(body.data).toHaveLength(1);
      expect(body.data[0]?.slug).toBe('robe-cocktail');
      expect(body.meta.total).toBe(1);
    });

    it('rejects an invalid status enum value (400)', async () => {
      await request(server()).get('/products').query({ status: 'NOT_A_STATUS' }).expect(400);
    });

    it('switches to similar-products mode when exclude + categoryId are both present', async () => {
      listSimilarProductsUseCase.execute.mockResolvedValue([sampleProduct()]);

      const response = await request(server())
        .get('/products')
        .query({ categoryId: 'cat-1', exclude: 'product-2', limit: 4 })
        .expect(200);

      expect(listSimilarProductsUseCase.execute).toHaveBeenCalledWith({
        categoryId: 'cat-1',
        excludeProductId: 'product-2',
        limit: 4,
      });
      expect(listProductsUseCase.execute).not.toHaveBeenCalled();
      const body = response.body as Array<{ slug: string }>;
      expect(body).toHaveLength(1);
    });
  });

  describe('GET /products/:slug', () => {
    it('returns the product for a known slug', async () => {
      getProductBySlugUseCase.execute.mockResolvedValue(sampleProduct());

      const response = await request(server()).get('/products/robe-cocktail').expect(200);

      const body = response.body as { slug: string; price: { amount: string } };
      expect(body.slug).toBe('robe-cocktail');
      expect(body.price.amount).toBe('150000.00');
    });

    it('returns 404 for an unknown slug', async () => {
      getProductBySlugUseCase.execute.mockRejectedValue(new NotFoundException('Product with slug "missing" not found'));

      await request(server()).get('/products/missing').expect(404);
    });
  });
});
