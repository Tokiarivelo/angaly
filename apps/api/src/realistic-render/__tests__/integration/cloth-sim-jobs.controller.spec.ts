import type { Server } from 'node:http';

import type { INestApplication } from '@nestjs/common';
import { ConflictException, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';

import { RealisticRenderConfig } from '../../application/services/realistic-render.config';
import { ClaimClothSimJobUseCase } from '../../application/use-cases/claim-cloth-sim-job.use-case';
import { CompleteClothSimJobUseCase } from '../../application/use-cases/complete-cloth-sim-job.use-case';
import { CreateClothSimUploadTargetUseCase } from '../../application/use-cases/create-cloth-sim-upload-target.use-case';
import { FailClothSimJobUseCase } from '../../application/use-cases/fail-cloth-sim-job.use-case';
import { ClothSimJobsController } from '../../presentation/controllers/cloth-sim-jobs.controller';
import { ClothSimWorkerGuard } from '../../presentation/guards/cloth-sim-worker.guard';
import { RENDER_ID } from '../unit/fixtures';

describe('ClothSimJobsController (integration)', () => {
  let app: INestApplication;
  const claim = { execute: jest.fn() };
  const uploadTarget = { execute: jest.fn() };
  const complete = { execute: jest.fn() };
  const fail = { execute: jest.fn() };
  const env = { ...process.env };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [ClothSimJobsController],
      providers: [
        RealisticRenderConfig,
        ClothSimWorkerGuard,
        { provide: ClaimClothSimJobUseCase, useValue: claim },
        { provide: CreateClothSimUploadTargetUseCase, useValue: uploadTarget },
        { provide: CompleteClothSimJobUseCase, useValue: complete },
        { provide: FailClothSimJobUseCase, useValue: fail },
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
    process.env = { ...env, CLOTH_SIM_WORKER_TOKEN: 'worker-secret' };
  });

  afterEach(() => {
    process.env = { ...env };
  });

  const server = (): Server => app.getHttpServer() as Server;
  const auth = 'Bearer worker-secret';

  it('claim hands the next job', async () => {
    claim.execute.mockResolvedValue({ renderId: RENDER_ID, pieces: [] });
    const response = await request(server()).post('/internal/cloth-sim/jobs/claim').set('Authorization', auth).expect(200);
    expect(response.body).toEqual({ job: { renderId: RENDER_ID, pieces: [] } });
  });

  it('claim answers job: null on an empty queue', async () => {
    claim.execute.mockResolvedValue(null);
    const response = await request(server()).post('/internal/cloth-sim/jobs/claim').set('Authorization', auth).expect(200);
    expect(response.body).toEqual({ job: null });
  });

  it('refuses a wrong or missing worker token', async () => {
    await request(server()).post('/internal/cloth-sim/jobs/claim').set('Authorization', 'Bearer nope').expect(401);
    await request(server()).post('/internal/cloth-sim/jobs/claim').expect(401);
    await request(server()).post('/internal/cloth-sim/jobs/claim').set('Authorization', 'Basic worker-secret').expect(401);
    expect(claim.execute).not.toHaveBeenCalled();
  });

  it('is off (503) without CLOTH_SIM_WORKER_TOKEN', async () => {
    delete process.env.CLOTH_SIM_WORKER_TOKEN;
    await request(server()).post('/internal/cloth-sim/jobs/claim').set('Authorization', auth).expect(503);
  });

  it('upload-target returns the presigned PUT', async () => {
    uploadTarget.execute.mockResolvedValue({ uploadUrl: 'http://minio/put', objectKey: 'k', bucket: 'patterns', expiresInSeconds: 600 });
    const response = await request(server())
      .post(`/internal/cloth-sim/jobs/${RENDER_ID}/upload-target`)
      .set('Authorization', auth)
      .expect(200);
    expect(uploadTarget.execute).toHaveBeenCalledWith(RENDER_ID);
    expect(response.body.uploadUrl).toBe('http://minio/put');
  });

  it('rejects a render id that is not a uuid', async () => {
    await request(server()).post('/internal/cloth-sim/jobs/abc/upload-target').set('Authorization', auth).expect(400);
  });

  it('done validates the report and completes the job', async () => {
    complete.execute.mockResolvedValue(undefined);
    const body = { objectKey: `realistic-renders/${RENDER_ID}/x.glb`, sizeBytes: 210000, durationMs: 300000, simPose: { a: 1 }, metrics: { b: 2 } };
    await request(server()).post(`/internal/cloth-sim/jobs/${RENDER_ID}/done`).set('Authorization', auth).send(body).expect(200, { ok: true });
    expect(complete.execute).toHaveBeenCalledWith(RENDER_ID, expect.objectContaining(body));
  });

  it('done rejects a malformed report', async () => {
    await request(server())
      .post(`/internal/cloth-sim/jobs/${RENDER_ID}/done`)
      .set('Authorization', auth)
      .send({ objectKey: '', sizeBytes: -1, durationMs: 'long' })
      .expect(400);
    expect(complete.execute).not.toHaveBeenCalled();
  });

  it('done passes a conflict through (job taken back)', async () => {
    complete.execute.mockRejectedValue(new ConflictException('plus en cours'));
    await request(server())
      .post(`/internal/cloth-sim/jobs/${RENDER_ID}/done`)
      .set('Authorization', auth)
      .send({ objectKey: 'k', sizeBytes: 1, durationMs: 1 })
      .expect(409);
  });

  it('failed records the reason', async () => {
    fail.execute.mockResolvedValue(undefined);
    await request(server())
      .post(`/internal/cloth-sim/jobs/${RENDER_ID}/failed`)
      .set('Authorization', auth)
      .send({ error: 'Blender timeout', durationMs: 600000 })
      .expect(200);
    expect(fail.execute).toHaveBeenCalledWith(RENDER_ID, { error: 'Blender timeout', durationMs: 600000 });
  });
});
