import type { INestApplication, ExecutionContext } from '@nestjs/common';
import { Review } from '../../domain/entities/review.entity';
import { ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { ReviewsController } from '../../presentation/controllers/reviews.controller';
import { CreateReviewUseCase } from '../../application/use-cases/create-review.use-case';
import { ListReviewsForProductUseCase } from '../../application/use-cases/list-reviews-for-product.use-case';
import { MarkReviewVerifiedUseCase } from '../../application/use-cases/mark-review-verified.use-case';
import { JwtAuthGuard } from '../../../auth/presentation/guards/jwt-auth.guard';
import { RolesGuard } from '../../../auth/presentation/guards/roles.guard';

describe('ReviewsController (Integration)', () => {
  let app: INestApplication;
  
  const createReviewUseCase = { execute: jest.fn() };
  const listReviewsForProductUseCase = { execute: jest.fn() };
  const markReviewVerifiedUseCase = { execute: jest.fn() };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [ReviewsController],
      providers: [
        { provide: CreateReviewUseCase, useValue: createReviewUseCase },
        { provide: ListReviewsForProductUseCase, useValue: listReviewsForProductUseCase },
        { provide: MarkReviewVerifiedUseCase, useValue: markReviewVerifiedUseCase },
      ],
    })
    .overrideGuard(JwtAuthGuard)
    .useValue({
      canActivate: (context: ExecutionContext) => {
        const req = context.switchToHttp().getRequest();
        req.user = { userId: 'u1', customerId: 'c1', role: 'CLIENT', email: 'test@example.com' };
        return true;
      }
    }) // Mock Auth
    .overrideGuard(RolesGuard)
    .useValue({ canActivate: () => true }) // Mock Auth
    .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });
  
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('POST /products/:id/reviews - creates a review (201)', async () => {
    createReviewUseCase.execute.mockResolvedValue(
      new Review('r1', 'p1', 'c1', 5, 'Excellent!', false, new Date())
    );

    const res = await request(app.getHttpServer())
      .post(`/products/p1/reviews`)
      .send({ rating: 5, comment: 'Excellent!' });

    expect(res.status).toBe(201);
    expect(res.body.rating).toBe(5);
  });

  it('POST /products/:id/reviews - fails if rating invalid (400)', async () => {
    const res = await request(app.getHttpServer())
      .post(`/products/p1/reviews`)
      .send({ rating: 6, comment: 'Excellent!' });

    expect(res.status).toBe(400);
  });

  it('GET /products/:id/reviews - lists reviews (200)', async () => {
    listReviewsForProductUseCase.execute.mockResolvedValue([
      new Review('r1', 'p1', 'c1', 5, 'Excellent!', false, new Date())
    ]);

    const res = await request(app.getHttpServer())
      .get(`/products/p1/reviews`);

    expect(res.status).toBe(200);
    expect(res.body).toBeInstanceOf(Array);
    expect(res.body.length).toBe(1);
  });
  
  it('POST /reviews/:id/verify - verifies a review (200) as ADMIN', async () => {
    markReviewVerifiedUseCase.execute.mockResolvedValue(
      new Review('r1', 'p1', 'c1', 5, 'Excellent!', true, new Date())
    );
    
    const res = await request(app.getHttpServer())
      .post(`/reviews/r1/verify`);

    expect(res.status).toBe(201); // NestJS default for POST is 201
    expect(res.body.isVerified).toBe(true);
  });
});
