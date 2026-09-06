import type { Server } from 'node:http';

import type { INestApplication } from '@nestjs/common';
import { NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';

import { GetAtelierBySlugUseCase } from '../../application/use-cases/get-atelier-by-slug.use-case';
import { ListAteliersUseCase } from '../../application/use-cases/list-ateliers.use-case';
import { AtelierEntity } from '../../domain/entities/atelier.entity';
import type { AtelierOpeningHours } from '../../domain/value-objects/opening-hours.vo';
import { AteliersController } from '../../presentation/controllers/ateliers.controller';

const CLOSED_WEEK: AtelierOpeningHours = {
  monday: { isOpen: false, slots: [] },
  tuesday: { isOpen: false, slots: [] },
  wednesday: { isOpen: false, slots: [] },
  thursday: { isOpen: false, slots: [] },
  friday: { isOpen: false, slots: [] },
  saturday: { isOpen: false, slots: [] },
  sunday: { isOpen: false, slots: [] },
};

function sampleAtelier(): AtelierEntity {
  return AtelierEntity.create({
    id: 'atelier-1',
    slug: 'antananarivo-centre',
    name: 'Atelier Antananarivo Centre',
    address: '12 Rue de la Paix',
    city: 'Antananarivo',
    phone: null,
    openingHours: CLOSED_WEEK,
    services: ['Essayage'],
    latitude: null,
    longitude: null,
    media: [],
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  });
}

describe('AteliersController (integration)', () => {
  let app: INestApplication;
  const listAteliersUseCase = { execute: jest.fn() };
  const getAtelierBySlugUseCase = { execute: jest.fn() };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [AteliersController],
      providers: [
        { provide: ListAteliersUseCase, useValue: listAteliersUseCase },
        { provide: GetAtelierBySlugUseCase, useValue: getAtelierBySlugUseCase },
      ],
    }).compile();

    app = moduleRef.createNestApplication();
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

  it('GET /ateliers returns every atelier as a plain array (no pagination envelope)', async () => {
    listAteliersUseCase.execute.mockResolvedValue([sampleAtelier()]);

    const response = await request(server()).get('/ateliers').expect(200);

    expect(response.body as unknown[]).toHaveLength(1);
  });

  it('GET /ateliers/:slug returns the atelier', async () => {
    getAtelierBySlugUseCase.execute.mockResolvedValue(sampleAtelier());

    const response = await request(server()).get('/ateliers/antananarivo-centre').expect(200);

    expect(getAtelierBySlugUseCase.execute).toHaveBeenCalledWith('antananarivo-centre');
    const body = response.body as { slug: string; services: string[] };
    expect(body.slug).toBe('antananarivo-centre');
    expect(body.services).toEqual(['Essayage']);
  });

  it('GET /ateliers/:slug returns 404 when the use-case throws NotFoundException', async () => {
    getAtelierBySlugUseCase.execute.mockRejectedValue(
      new NotFoundException('Atelier with slug "missing" not found'),
    );

    await request(server()).get('/ateliers/missing').expect(404);
  });
});
