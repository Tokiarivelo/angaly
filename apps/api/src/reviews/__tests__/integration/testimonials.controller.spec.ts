import type { INestApplication } from '@nestjs/common';
import { Testimonial } from '../../domain/entities/testimonial.entity';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { TestimonialsController } from '../../presentation/controllers/testimonials.controller';
import { ListFeaturedTestimonialsUseCase } from '../../application/use-cases/list-featured-testimonials.use-case';

describe('TestimonialsController (Integration)', () => {
  let app: INestApplication;
  
  const listFeaturedTestimonialsUseCase = { execute: jest.fn() };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [TestimonialsController],
      providers: [
        { provide: ListFeaturedTestimonialsUseCase, useValue: listFeaturedTestimonialsUseCase },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });
  
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('GET /testimonials?featured=true - lists featured testimonials (200)', async () => {
    listFeaturedTestimonialsUseCase.execute.mockResolvedValue([
      new Testimonial(
        't1',
        'Test Customer',
        null,
        'Amazing dress!',
        true,
        true,
        new Date(),
        []
      )
    ]);

    const res = await request(app.getHttpServer())
      .get(`/testimonials?featured=true`);

    expect(res.status).toBe(200);
    expect(res.body).toBeInstanceOf(Array);
    expect(res.body.length).toBe(1);
    expect(res.body[0].customerName).toBe('Test Customer');
  });
  
  it('GET /testimonials - defaults to featured if no query param provided (200)', async () => {
    listFeaturedTestimonialsUseCase.execute.mockResolvedValue([]);

    const res = await request(app.getHttpServer())
      .get(`/testimonials`);

    expect(res.status).toBe(200);
    expect(res.body).toBeInstanceOf(Array);
    expect(res.body.length).toBe(0);
  });
});
