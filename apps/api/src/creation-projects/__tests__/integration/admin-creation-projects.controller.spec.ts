import type { Server } from 'node:http';

import type { INestApplication } from '@nestjs/common';
import { ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { CreationProjectStage } from '@angaly/types';
import request from 'supertest';

import { ACCESS_TOKEN_SERVICE } from '../../../auth/domain/services/access-token.service';
import { JwtAuthGuard } from '../../../auth/presentation/guards/jwt-auth.guard';
import { RolesGuard } from '../../../auth/presentation/guards/roles.guard';
import { AddCreationProjectStageMediaUseCase } from '../../application/use-cases/add-creation-project-stage-media.use-case';
import { AddCreationProjectStageNoteUseCase } from '../../application/use-cases/add-creation-project-stage-note.use-case';
import { AssignCreationProjectUseCase } from '../../application/use-cases/assign-creation-project.use-case';
import { CreateAdminCreationProjectUseCase } from '../../application/use-cases/create-admin-creation-project.use-case';
import { DeleteCreationProjectStageMediaUseCase } from '../../application/use-cases/delete-creation-project-stage-media.use-case';
import { DeleteCreationProjectStageNoteUseCase } from '../../application/use-cases/delete-creation-project-stage-note.use-case';
import { GetAdminCreationProjectUseCase } from '../../application/use-cases/get-admin-creation-project.use-case';
import { ListAssignableStaffUseCase } from '../../application/use-cases/list-assignable-staff.use-case';
import { ListAllCreationProjectsUseCase } from '../../application/use-cases/list-all-creation-projects.use-case';
import { ListCustomersLookupUseCase } from '../../application/use-cases/list-customers-lookup.use-case';
import { ListQuotesLookupUseCase } from '../../application/use-cases/list-quotes-lookup.use-case';
import { UpdateCreationProjectStageUseCase } from '../../application/use-cases/update-creation-project-stage.use-case';
import { GenerateCreationProjectAiPatternUseCase } from '../../application/use-cases/generate-creation-project-ai-pattern.use-case';
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
  const createAdmin = { execute: jest.fn() };
  const listCustomers = { execute: jest.fn() };
  const listQuotes = { execute: jest.fn() };
  const addStageNote = { execute: jest.fn() };
  const deleteStageNote = { execute: jest.fn() };
  const addStageMedia = { execute: jest.fn() };
  const deleteStageMedia = { execute: jest.fn() };
  const generatePattern = { execute: jest.fn() };
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
        { provide: CreateAdminCreationProjectUseCase, useValue: createAdmin },
        { provide: ListCustomersLookupUseCase, useValue: listCustomers },
        { provide: ListQuotesLookupUseCase, useValue: listQuotes },
        { provide: AddCreationProjectStageNoteUseCase, useValue: addStageNote },
        { provide: DeleteCreationProjectStageNoteUseCase, useValue: deleteStageNote },
        { provide: AddCreationProjectStageMediaUseCase, useValue: addStageMedia },
        { provide: DeleteCreationProjectStageMediaUseCase, useValue: deleteStageMedia },
        { provide: GenerateCreationProjectAiPatternUseCase, useValue: generatePattern },
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

  it('creates a new creation project from staff back-office', async () => {
    createAdmin.execute.mockResolvedValue(sample);
    const payload = {
      title: 'Robe de mariée — Mme Rakoto',
      customerId: 'c-1',
      garmentType: 'Robe de mariée',
      occasion: 'Mariage',
      eventDate: '2026-12-14',
      budgetRange: '1 000 000–2 000 000 Ar',
      description: 'Notes de consultation',
      initialStage: CreationProjectStage.CONSULTATION,
    };
    const res = await request(server()).post('/admin/creation-projects').set(auth).send(payload).expect(201);
    expect(res.body).toEqual(expect.objectContaining({ id: 'p-1', reference: 'CRP-2026-0001' }));
    expect(createAdmin.execute).toHaveBeenCalledWith(expect.objectContaining({ title: 'Robe de mariée — Mme Rakoto' }), 'u-1');
  });

  it('lists customers for lookup', async () => {
    listCustomers.execute.mockResolvedValue([
      { id: 'c-1', firstName: 'Hanitra', lastName: 'Rakoto', email: 'hanitra@angaly.mg', phone: '+261340012345' },
    ]);
    const res = await request(server()).get('/admin/creation-projects/customers?q=Hanitra').set(auth).expect(200);
    expect(res.body).toEqual([
      expect.objectContaining({ id: 'c-1', firstName: 'Hanitra', lastName: 'Rakoto' }),
    ]);
    expect(listCustomers.execute).toHaveBeenCalledWith('Hanitra');
  });

  it('lists quotes for lookup', async () => {
    listQuotes.execute.mockResolvedValue([
      { id: 'q-1', quoteNumber: 'ANG-DEV-2026-0042', total: '1500000', customerName: 'Hanitra Rakoto' },
    ]);
    const res = await request(server()).get('/admin/creation-projects/quotes').set(auth).expect(200);
    expect(res.body).toEqual([
      expect.objectContaining({ id: 'q-1', quoteNumber: 'ANG-DEV-2026-0042' }),
    ]);
  });

  it('adds a stage note', async () => {
    addStageNote.execute.mockResolvedValue({
      id: 'n-1',
      projectId: 'p-1',
      stage: CreationProjectStage.CONCEPTION,
      content: 'Ajuster les pinces taille',
      authorEmail: 'couturiere@angaly.mg',
      createdAt: new Date('2026-01-02T10:00:00.000Z'),
      updatedAt: new Date('2026-01-02T10:00:00.000Z'),
    });
    const res = await request(server())
      .post('/admin/creation-projects/p-1/notes')
      .set(auth)
      .send({ stage: CreationProjectStage.CONCEPTION, content: 'Ajuster les pinces taille' })
      .expect(201);
    expect(res.body).toEqual(expect.objectContaining({ id: 'n-1', content: 'Ajuster les pinces taille' }));
    expect(addStageNote.execute).toHaveBeenCalledWith({
      projectId: 'p-1',
      stage: CreationProjectStage.CONCEPTION,
      content: 'Ajuster les pinces taille',
      authorId: 'u-1',
    });
  });

  it('deletes a stage note', async () => {
    deleteStageNote.execute.mockResolvedValue(undefined);
    await request(server()).delete('/admin/creation-projects/p-1/notes/n-1').set(auth).expect(204);
    expect(deleteStageNote.execute).toHaveBeenCalledWith({ projectId: 'p-1', noteId: 'n-1' });
  });

  it('adds a stage media reference', async () => {
    addStageMedia.execute.mockResolvedValue({
      id: 'm-1',
      projectId: 'p-1',
      stage: CreationProjectStage.PATRON,
      url: 'https://storage.angaly.mg/creations/patron-1.pdf',
      title: 'Patron de base',
      fileName: 'patron-1.pdf',
      mimeType: 'application/pdf',
      sizeBytes: 1048576,
      uploadedByEmail: 'couturiere@angaly.mg',
      createdAt: new Date('2026-01-02T11:00:00.000Z'),
    });
    const res = await request(server())
      .post('/admin/creation-projects/p-1/media')
      .set(auth)
      .send({
        stage: CreationProjectStage.PATRON,
        url: 'https://storage.angaly.mg/creations/patron-1.pdf',
        title: 'Patron de base',
        fileName: 'patron-1.pdf',
      })
      .expect(201);
    expect(res.body).toEqual(expect.objectContaining({ id: 'm-1', url: 'https://storage.angaly.mg/creations/patron-1.pdf' }));
    expect(addStageMedia.execute).toHaveBeenCalledWith({
      projectId: 'p-1',
      stage: CreationProjectStage.PATRON,
      url: 'https://storage.angaly.mg/creations/patron-1.pdf',
      title: 'Patron de base',
      fileName: 'patron-1.pdf',
      mimeType: null,
      sizeBytes: null,
      uploadedById: 'u-1',
    });
  });

  it('deletes a stage media reference', async () => {
    deleteStageMedia.execute.mockResolvedValue(undefined);
    await request(server()).delete('/admin/creation-projects/p-1/media/m-1').set(auth).expect(204);
    expect(deleteStageMedia.execute).toHaveBeenCalledWith({ projectId: 'p-1', mediaId: 'm-1' });
  });

  it('generates an AI pattern and saves media + note', async () => {
    generatePattern.execute.mockResolvedValue({
      projectId: 'p-1',
      garmentType: 'ROBE',
      svg: '<svg><g></g></svg>',
      pieces: [
        { name: 'Devant', seamAllowanceCm: 1.5, pathData: 'M0,0 L10,10 Z', boundingBox: { width: 10, height: 10 } },
      ],
      aiSuggestion: {
        summary: 'Coupe évasée couture',
        fabricAdvice: 'Soie sauvage',
        technicalNotes: ['Surjet 4 fils'],
        easeCm: { bust: 4, waist: 3, hips: 5 },
      },
      media: {
        id: 'm-patron-1',
        projectId: 'p-1',
        stage: CreationProjectStage.PATRON,
        url: 'data:image/svg+xml;utf8,<svg></svg>',
        title: 'Patron IA - Robe',
        fileName: 'patron-robe-p-1.svg',
        mimeType: 'image/svg+xml',
        sizeBytes: 120,
        uploadedByEmail: 'couturiere@angaly.mg',
        createdAt: new Date('2026-01-02T12:00:00.000Z'),
      },
      note: {
        id: 'n-patron-1',
        projectId: 'p-1',
        stage: CreationProjectStage.PATRON,
        content: 'Patron IA généré',
        authorEmail: 'couturiere@angaly.mg',
        createdAt: new Date('2026-01-02T12:00:00.000Z'),
        updatedAt: new Date('2026-01-02T12:00:00.000Z'),
      },
    });

    const res = await request(server())
      .post('/admin/creation-projects/p-1/generate-pattern')
      .set(auth)
      .send({
        garmentType: 'ROBE',
        description: 'Robe de gala avec encolure bateau',
        targetSize: '38',
      })
      .expect(201);

    expect(res.body).toEqual(expect.objectContaining({
      projectId: 'p-1',
      garmentType: 'ROBE',
      svg: '<svg><g></g></svg>',
    }));
    expect(generatePattern.execute).toHaveBeenCalledWith(
      'p-1',
      expect.objectContaining({
        garmentType: 'ROBE',
      }),
      'u-1',
    );
  });
});
