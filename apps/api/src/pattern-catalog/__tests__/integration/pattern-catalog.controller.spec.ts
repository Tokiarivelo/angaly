import type { Server } from 'node:http';

import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';

import { ACCESS_TOKEN_SERVICE } from '../../../auth/domain/services/access-token.service';
import { JwtAuthGuard } from '../../../auth/presentation/guards/jwt-auth.guard';
import { CUSTOMER_REPOSITORY } from '../../../customers/domain/repositories/customer.repository';
import { CreateProjectFromCatalogUseCase } from '../../application/use-cases/create-project-from-catalog.use-case';
import { ListPatternCatalogUseCase } from '../../application/use-cases/list-pattern-catalog.use-case';
import { PatternCatalogController } from '../../presentation/controllers/pattern-catalog.controller';

describe('PatternCatalogController (integration)', () => {
  let app: INestApplication;
  const listCatalog = { execute: jest.fn() };
  const createFromCatalog = { execute: jest.fn() };
  const customers = { findByUserId: jest.fn().mockResolvedValue({ id: 'c-1' }) };
  const accessTokenService = { sign: jest.fn(), verify: jest.fn().mockReturnValue({ sub: 'u-1', role: 'CLIENT' }) };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [PatternCatalogController],
      providers: [
        { provide: ListPatternCatalogUseCase, useValue: listCatalog },
        { provide: CreateProjectFromCatalogUseCase, useValue: createFromCatalog },
        { provide: CUSTOMER_REPOSITORY, useValue: customers },
        JwtAuthGuard,
        { provide: ACCESS_TOKEN_SERVICE, useValue: accessTokenService },
      ],
    }).compile();
    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  const server = (): Server => app.getHttpServer() as Server;

  it('GET /pattern-catalog lists the dresses (signed in)', async () => {
    listCatalog.execute.mockResolvedValue([{ id: 'qipao', title: 'Qipao (cheongsam)' }]);
    const res = await request(server()).get('/pattern-catalog').set('Authorization', 'Bearer t').expect(200);
    expect(res.body).toEqual([{ id: 'qipao', title: 'Qipao (cheongsam)' }]);
  });

  it('POST /pattern-catalog/:id/projects starts a project for the signed-in customer', async () => {
    createFromCatalog.execute.mockResolvedValue({ projectId: 'p-1' });
    const res = await request(server()).post('/pattern-catalog/qipao/projects').set('Authorization', 'Bearer t').expect(201);
    expect(res.body).toEqual({ projectId: 'p-1' });
    expect(createFromCatalog.execute).toHaveBeenCalledWith({ entryId: 'qipao', customerId: 'c-1', userId: 'u-1' });
  });

  it('refuses an anonymous visitor', async () => {
    await request(server()).get('/pattern-catalog').expect(401);
  });
});
