import type { Server } from 'node:http';

import type { INestApplication } from '@nestjs/common';
import { HttpException, HttpStatus, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';

import { ACCESS_TOKEN_SERVICE } from '../../../auth/domain/services/access-token.service';
import { JwtAuthGuard } from '../../../auth/presentation/guards/jwt-auth.guard';
import { CUSTOMER_REPOSITORY } from '../../../customers/domain/repositories/customer.repository';
import { GetRealisticRenderUseCase } from '../../application/use-cases/get-realistic-render.use-case';
import { RequestRealisticRenderUseCase } from '../../application/use-cases/request-realistic-render.use-case';
import { RealisticRenderController } from '../../presentation/controllers/realistic-render.controller';
import { makeRender, RENDER_ID } from '../unit/fixtures';

describe('RealisticRenderController (integration)', () => {
  let app: INestApplication;
  const requestRender = { execute: jest.fn() };
  const getRender = { execute: jest.fn(), latest: jest.fn() };
  const customerRepository = { findByUserId: jest.fn() };
  const accessTokenService = { sign: jest.fn(), verify: jest.fn() };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [RealisticRenderController],
      providers: [
        { provide: RequestRealisticRenderUseCase, useValue: requestRender },
        { provide: GetRealisticRenderUseCase, useValue: getRender },
        { provide: CUSTOMER_REPOSITORY, useValue: customerRepository },
        JwtAuthGuard,
        { provide: ACCESS_TOKEN_SERVICE, useValue: accessTokenService },
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    accessTokenService.verify.mockReturnValue({ sub: 'user-1', role: 'CLIENT' });
    customerRepository.findByUserId.mockResolvedValue({ id: 'customer-1' });
  });

  const server = (): Server => app.getHttpServer() as Server;

  it('POST queues a render in the requested pose', async () => {
    requestRender.execute.mockResolvedValue(makeRender({ pose: 'NEUTRE' }));

    const response = await request(server())
      .post('/pattern-versions/version-1/realistic-render')
      .set('Authorization', 'Bearer t')
      .send({ pose: 'NEUTRE' })
      .expect(201);

    expect(requestRender.execute).toHaveBeenCalledWith('version-1', 'customer-1', 'user-1', 'NEUTRE');
    expect(response.body).toMatchObject({
      id: RENDER_ID,
      versionId: 'version-1',
      pose: 'NEUTRE',
      status: 'QUEUED',
      glbUrl: null,
      cached: false,
      finishedAt: null,
    });
  });

  it('POST defaults to the PRESENTATION pose', async () => {
    requestRender.execute.mockResolvedValue(makeRender());
    await request(server()).post('/pattern-versions/version-1/realistic-render').set('Authorization', 'Bearer t').send({}).expect(201);
    expect(requestRender.execute).toHaveBeenCalledWith('version-1', 'customer-1', 'user-1', 'PRESENTATION');
  });

  it('POST rejects an unknown pose', async () => {
    await request(server())
      .post('/pattern-versions/version-1/realistic-render')
      .set('Authorization', 'Bearer t')
      .send({ pose: 'DANSE' })
      .expect(400);
    expect(requestRender.execute).not.toHaveBeenCalled();
  });

  it('POST passes the quota error through (429)', async () => {
    requestRender.execute.mockRejectedValue(new HttpException('Limite', HttpStatus.TOO_MANY_REQUESTS));
    await request(server()).post('/pattern-versions/version-1/realistic-render').set('Authorization', 'Bearer t').send({}).expect(429);
  });

  it('requires a signed-in user', async () => {
    accessTokenService.verify.mockImplementation(() => {
      throw new Error('bad token');
    });
    await request(server()).post('/pattern-versions/version-1/realistic-render').send({}).expect(401);
  });

  it('GET :renderId returns the render state with the simulated pose and the .glb', async () => {
    const finishedAt = new Date('2026-10-16T10:05:00Z');
    getRender.execute.mockResolvedValue(
      makeRender({
        status: 'DONE',
        glbUrl: 'https://cdn/patterns/x.glb',
        simPose: { leftArm: { raise: -7.5 } },
        durationMs: 300_000,
        cachedFromId: 'older',
        finishedAt,
      }),
    );

    const response = await request(server())
      .get(`/pattern-versions/version-1/realistic-render/${RENDER_ID}`)
      .set('Authorization', 'Bearer t')
      .expect(200);

    expect(getRender.execute).toHaveBeenCalledWith('version-1', RENDER_ID, 'customer-1');
    expect(response.body).toMatchObject({
      status: 'DONE',
      glbUrl: 'https://cdn/patterns/x.glb',
      simPose: { leftArm: { raise: -7.5 } },
      cached: true,
      finishedAt: finishedAt.toISOString(),
    });
  });

  it('GET returns the latest render of the version, filtered by pose', async () => {
    getRender.latest.mockResolvedValue(makeRender());
    await request(server())
      .get('/pattern-versions/version-1/realistic-render?pose=MIROIR')
      .set('Authorization', 'Bearer t')
      .expect(200);
    expect(getRender.latest).toHaveBeenCalledWith('version-1', 'customer-1', 'MIROIR');
  });

  it('GET answers an empty body when the version has no render yet', async () => {
    getRender.latest.mockResolvedValue(null);
    const response = await request(server())
      .get('/pattern-versions/version-1/realistic-render')
      .set('Authorization', 'Bearer t')
      .expect(200);
    expect(response.body).toEqual({});
  });
});
