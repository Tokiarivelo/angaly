import type { Server } from 'node:http';

import type { INestApplication } from '@nestjs/common';
import { ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { CreationProjectStage } from '@angaly/types';
import request from 'supertest';

import { ACCESS_TOKEN_SERVICE } from '../../../auth/domain/services/access-token.service';
import { JwtAuthGuard } from '../../../auth/presentation/guards/jwt-auth.guard';
import { RolesGuard } from '../../../auth/presentation/guards/roles.guard';
import { AssignCreationProjectUseCase } from '../../application/use-cases/assign-creation-project.use-case';
import { GetAdminCreationProjectUseCase } from '../../application/use-cases/get-admin-creation-project.use-case';
import { ListAssignableStaffUseCase } from '../../application/use-cases/list-assignable-staff.use-case';
import { ListAllCreationProjectsUseCase } from '../../application/use-cases/list-all-creation-projects.use-case';
import { UpdateCreationProjectStageUseCase } from '../../application/use-cases/update-creation-project-stage.use-case';
import { CreationProjectEntity } from '../../domain/entities/creation-project.entity';
import { AdminCreationProjectsController } from '../../presentation/controllers/admin-creation-projects.controller';

const sample = CreationProjectEntity.create({
  id: 'p-1',
  reference: 'CRP-2026-0001',
  customerId: 'c-1',
  title: 'Robe mariage 2026',
  description: null,
  stage: CreationProjectStage.PATRON,
  quoteId: 'q-1',
  creationId: null,
  completedAt: null,
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-02T00:00:00.000Z'),
});

describe('AdminCreationProjectsController (integration)', () => {
  let app: INestApplication;
  const listAll = { execute: jest.fn() };
  const updateStage = { execute: jest.fn() };
  const assign = { execute: jest.fn() };
  const detail = { execute: jest.fn() };
  const assignees = { execute: jest.fn() };
  const tokens = { sign: jest.fn(), verify: jest.fn() };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [AdminCreationProjectsController],
      providers: [
        { provide: ListAllCreationProjectsUseCase, useValue: listAll },
        { provide: UpdateCreationProjectStageUseCase, useValue: updateStage },
        { provide: AssignCreationProjectUseCase, useValue: assign },
        { provide: GetAdminCreationProjectUseCase, useValue: detail },
        { provide: ListAssignableStaffUseCase, useValue: assignees },
        JwtAuthGuard,
        RolesGuard,
        { provide: ACCESS_TOKEN_SERVICE, useValue: tokens },
      ],
    }).compile();
    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    tokens.verify.mockReturnValue({ sub: 'u-1', role: 'MANAGER' });
  });

  const server = () => app.getHttpServer() as Server;
  const auth = { Authorization: 'Bearer t' };

  it('returns 401 without a bearer token', async () => {
    await request(server()).get('/admin/creation-projects').expect(401);
  });

  it('returns 403 for a customer', async () => {
    tokens.verify.mockReturnValue({ sub: 'u-2', role: 'CLIENT' });
    await request(server()).get('/admin/creation-projects').set(auth).expect(403);
  });

  it('lists every project, filtered by a valid stage', async () => {
    listAll.execute.mockResolvedValue([sample]);
    const res = await request(server()).get('/admin/creation-projects?stage=PATRON').set(auth).expect(200);
    expect(listAll.execute).toHaveBeenCalledWith(CreationProjectStage.PATRON);
    expect(res.body).toEqual([expect.objectContaining({ id: 'p-1', stage: 'PATRON' })]);
  });

  it('ignores an unknown stage filter', async () => {
    listAll.execute.mockResolvedValue([]);
    await request(server()).get('/admin/creation-projects?stage=NOPE').set(auth).expect(200);
    expect(listAll.execute).toHaveBeenCalledWith(undefined);
  });

  it('moves a project to another stage', async () => {
    updateStage.execute.mockResolvedValue(sample);
    await request(server()).patch('/admin/creation-projects/p-1/stage').set(auth).send({ stage: 'CONFECTION' }).expect(200);
    expect(updateStage.execute).toHaveBeenCalledWith('p-1', CreationProjectStage.CONFECTION, 'u-1');
  });

  it('rejects an invalid stage with 400', async () => {
    await request(server()).patch('/admin/creation-projects/p-1/stage').set(auth).send({ stage: 'NOPE' }).expect(400);
    expect(updateStage.execute).not.toHaveBeenCalled();
  });

  it('lists assignable staff before the :id route', async () => {
    assignees.execute.mockResolvedValue([{ id: 'u-3', email: 'c@angaly.mg', role: 'COUTURIERE' }]);
    const res = await request(server()).get('/admin/creation-projects/assignees').set(auth).expect(200);
    expect(res.body).toEqual([expect.objectContaining({ id: 'u-3' })]);
    expect(detail.execute).not.toHaveBeenCalled();
  });

  it('returns the project detail with its stage history', async () => {
    detail.execute.mockResolvedValue(
      CreationProjectEntity.create({
        id: 'p-1',
        reference: 'CRP-2026-0001',
        customerId: 'c-1',
        title: 'Robe mariage 2026',
        description: null,
        stage: CreationProjectStage.PATRON,
        quoteId: null,
        creationId: null,
        completedAt: null,
        stageHistory: [
          {
            id: 'e-1',
            fromStage: CreationProjectStage.CONCEPTION,
            toStage: CreationProjectStage.PATRON,
            changedByEmail: 'm@angaly.mg',
            createdAt: new Date('2026-01-03T00:00:00.000Z'),
          },
        ],
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
        updatedAt: new Date('2026-01-02T00:00:00.000Z'),
      }),
    );
    const res = await request(server()).get('/admin/creation-projects/p-1').set(auth).expect(200);
    expect(res.body).toEqual(
      expect.objectContaining({
        id: 'p-1',
        stageHistory: [expect.objectContaining({ toStage: 'PATRON', changedByEmail: 'm@angaly.mg' })],
      }),
    );
  });

  it('assigns a project to a staff member', async () => {
    assign.execute.mockResolvedValue(sample);
    await request(server()).patch('/admin/creation-projects/p-1/assignee').set(auth).send({ userId: 'u-3' }).expect(200);
    expect(assign.execute).toHaveBeenCalledWith('p-1', 'u-3');
  });

  it('unassigns with a null userId', async () => {
    assign.execute.mockResolvedValue(sample);
    await request(server()).patch('/admin/creation-projects/p-1/assignee').set(auth).send({ userId: null }).expect(200);
    expect(assign.execute).toHaveBeenCalledWith('p-1', null);
  });
});
