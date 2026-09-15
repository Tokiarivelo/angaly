import type { Server } from 'node:http';

import type { INestApplication } from '@nestjs/common';
import { ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';

import { GetSizeChartsUseCase } from '../../application/use-cases/get-size-charts.use-case';
import { SizeChartsController } from '../../presentation/controllers/size-charts.controller';

describe('SizeChartsController (integration)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [SizeChartsController],
      providers: [GetSizeChartsUseCase],
    }).compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  function server(): Server {
    return app.getHttpServer() as Server;
  }

  it('GET /measurements/size-charts returns both charts by default', async () => {
    const response = await request(server()).get('/measurements/size-charts').expect(200);
    const body = response.body as Record<string, unknown>;
    expect(Object.keys(body).sort()).toEqual(['FEMME', 'HOMME']);
  });

  it('GET /measurements/size-charts?gender=FEMME returns only the women chart', async () => {
    const response = await request(server())
      .get('/measurements/size-charts')
      .query({ gender: 'FEMME' })
      .expect(200);
    expect(Array.isArray(response.body)).toBe(true);
    const body = response.body as Array<{ label: string; frSize: string }>;
    expect(body[0]).toMatchObject({ label: expect.any(String), frSize: expect.any(String) });
  });

  it('rejects an invalid gender with 400', async () => {
    await request(server())
      .get('/measurements/size-charts')
      .query({ gender: 'AUTRE' })
      .expect(400);
  });
});
