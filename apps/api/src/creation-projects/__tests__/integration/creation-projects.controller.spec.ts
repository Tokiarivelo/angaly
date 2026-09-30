import type { Server } from 'node:http';

import type { INestApplication } from '@nestjs/common';
import { ForbiddenException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { CreationProjectStage } from '@angaly/types';
import request from 'supertest';

import { ACCESS_TOKEN_SERVICE } from '../../../auth/domain/services/access-token.service';
import { JwtAuthGuard } from '../../../auth/presentation/guards/jwt-auth.guard';
import { GetCreationProjectUseCase } from '../../application/use-cases/get-creation-project.use-case';
import { ListCreationProjectsUseCase } from '../../application/use-cases/list-creation-projects.use-case';
import { CreationProjectEntity } from '../../domain/entities/creation-project.entity';
import { CreationProjectsController } from '../../presentation/controllers/creation-projects.controller';

const sample = CreationProjectEntity.create({
  id: 'p-1',
  reference: 'CRP-2026-0001',
  customerId: 'c-1',
  title: 'Robe mariage 2026',
  description: null,
  stage: CreationProjectStage.CONFECTION,
  quoteId: null,
  creationId: null,
  completedAt: null,
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-02T00:00:00.000Z'),
});

describe('CreationProjectsController (integration)', () => {
  let app: INestApplication;
  const list = { execute: jest.fn() };
  const get = { execute: jest.fn() };
  const tokens = { sign: jest.fn(), verify: jest.fn() };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [CreationProjectsController],
      providers: [
        { provide: ListCreationProjectsUseCase, useValue: list },
        { provide: GetCreationProjectUseCase, useValue: get },
        JwtAuthGuard,
        { provide: ACCESS_TOKEN_SERVICE, useValue: tokens },
      ],
    }).compile();
    app = moduleRef.createNestApplication();
    await app.init();
    tokens.verify.mockReturnValue({ sub: 'u-1', role: 'CLIENT' });
  });

  afterAll(async () => {
    await app.close();
  });

  const server = () => app.getHttpServer() as Server;
  const auth = { Authorization: 'Bearer t' };

  it('returns 401 without a bearer token', async () => {
    await request(server()).get('/creation-projects').expect(401);
  });

  it('lists the caller’s projects', async () => {
    list.execute.mockResolvedValue([sample]);
    const res = await request(server()).get('/creation-projects').set(auth).expect(200);
    expect(list.execute).toHaveBeenCalledWith('u-1');
    expect(res.body).toEqual([
      expect.objectContaining({ id: 'p-1', title: 'Robe mariage 2026', stage: 'CONFECTION', completedAt: null }),
    ]);
  });

  it('returns one project', async () => {
    get.execute.mockResolvedValue(sample);
    await request(server()).get('/creation-projects/p-1').set(auth).expect(200);
    expect(get.execute).toHaveBeenCalledWith('u-1', 'p-1');
  });

  it('maps a foreign project to 403', async () => {
    get.execute.mockRejectedValue(new ForbiddenException());
    await request(server()).get('/creation-projects/p-2').set(auth).expect(403);
  });
});
