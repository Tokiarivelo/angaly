import type { Server } from 'node:http';

import type { INestApplication } from '@nestjs/common';
import { ValidationPipe } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import request from 'supertest';

import { ACCESS_TOKEN_SERVICE } from '../../../auth/domain/services/access-token.service';
import { JwtAuthGuard } from '../../../auth/presentation/guards/jwt-auth.guard';
import { RolesGuard } from '../../../auth/presentation/guards/roles.guard';
import { GetSectionUseCase } from '../../application/use-cases/get-section.use-case';
import { ListSectionsUseCase } from '../../application/use-cases/list-sections.use-case';
import { ListSectionVersionsUseCase } from '../../application/use-cases/list-section-versions.use-case';
import { PublishSectionUseCase } from '../../application/use-cases/publish-section.use-case';
import { RestoreSectionVersionUseCase } from '../../application/use-cases/restore-section-version.use-case';
import { SaveSectionDraftUseCase } from '../../application/use-cases/save-section-draft.use-case';
import { PageSectionEntity } from '../../domain/entities/page-section.entity';
import { PageSectionVersionEntity } from '../../domain/entities/page-section-version.entity';
import { PageSectionsController } from '../../presentation/controllers/page-sections.controller';

function buildSection(overrides: Partial<Parameters<typeof PageSectionEntity.create>[0]> = {}) {
  return PageSectionEntity.create({
    id: 'section-1',
    page: 'accueil',
    sectionKey: 'hero',
    locale: 'FR',
    titleText: 'Bienvenue',
    subtitleText: null,
    bodyText: null,
    ctaPrimaryLabel: null,
    ctaSecondaryLabel: null,
    dataJson: null,
    mediaId: null,
    status: 'DRAFT',
    updatedById: null,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    ...overrides,
  });
}

describe('PageSectionsController (integration)', () => {
  let app: INestApplication;
  const listSectionsUseCase = { execute: jest.fn() };
  const getSectionUseCase = { execute: jest.fn() };
  const saveSectionDraftUseCase = { execute: jest.fn() };
  const publishSectionUseCase = { execute: jest.fn() };
  const listSectionVersionsUseCase = { execute: jest.fn() };
  const restoreSectionVersionUseCase = { execute: jest.fn() };
  const accessTokenService = { sign: jest.fn(), verify: jest.fn() };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [PageSectionsController],
      providers: [
        { provide: ListSectionsUseCase, useValue: listSectionsUseCase },
        { provide: GetSectionUseCase, useValue: getSectionUseCase },
        { provide: SaveSectionDraftUseCase, useValue: saveSectionDraftUseCase },
        { provide: PublishSectionUseCase, useValue: publishSectionUseCase },
        { provide: ListSectionVersionsUseCase, useValue: listSectionVersionsUseCase },
        { provide: RestoreSectionVersionUseCase, useValue: restoreSectionVersionUseCase },
        JwtAuthGuard,
        RolesGuard,
        Reflector,
        { provide: ACCESS_TOKEN_SERVICE, useValue: accessTokenService },
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
    await app.init();
    accessTokenService.verify.mockReturnValue({ sub: 'admin-1', role: 'ADMIN' });
  });

  afterAll(async () => {
    await app.close();
  });

  afterEach(() => {
    jest.clearAllMocks();
    accessTokenService.verify.mockReturnValue({ sub: 'admin-1', role: 'ADMIN' });
  });

  function server(): Server {
    return app.getHttpServer() as Server;
  }

  it('GET /content/sections returns the grouped list for a MANAGER', async () => {
    accessTokenService.verify.mockReturnValue({ sub: 'manager-1', role: 'MANAGER' });
    listSectionsUseCase.execute.mockResolvedValue([
      { page: 'accueil', sections: [{ sectionKey: 'hero', status: 'DRAFT', updatedAt: new Date('2026-01-01'), locales: ['FR'] }] },
    ]);

    const response = await request(server())
      .get('/content/sections')
      .set('Authorization', 'Bearer valid-token')
      .expect(200);

    expect(response.body).toEqual([
      { page: 'accueil', sections: [{ sectionKey: 'hero', status: 'DRAFT', updatedAt: '2026-01-01T00:00:00.000Z', locales: ['FR'] }] },
    ]);
  });

  it('GET /content/sections returns 403 for a CLIENT', async () => {
    accessTokenService.verify.mockReturnValue({ sub: 'client-1', role: 'CLIENT' });

    await request(server()).get('/content/sections').set('Authorization', 'Bearer valid-token').expect(403);
    expect(listSectionsUseCase.execute).not.toHaveBeenCalled();
  });

  it('GET /content/sections returns 403 for a COUTURIERE', async () => {
    accessTokenService.verify.mockReturnValue({ sub: 'couturiere-1', role: 'COUTURIERE' });

    await request(server()).get('/content/sections').set('Authorization', 'Bearer valid-token').expect(403);
  });

  it('GET /content/sections returns 401 with no token', async () => {
    await request(server()).get('/content/sections').expect(401);
  });

  it('GET /content/sections/:id/versions lists the version history', async () => {
    listSectionVersionsUseCase.execute.mockResolvedValue([
      PageSectionVersionEntity.create({
        id: 'version-1',
        pageSectionId: 'section-1',
        snapshotJson: { titleText: 'Ancien titre' },
        editedById: 'admin-1',
        createdAt: new Date('2026-01-01'),
      }),
    ]);

    const response = await request(server())
      .get('/content/sections/section-1/versions')
      .set('Authorization', 'Bearer valid-token')
      .expect(200);

    expect(listSectionVersionsUseCase.execute).toHaveBeenCalledWith('section-1');
    expect(response.body).toHaveLength(1);
  });

  it('GET /content/sections/:page/:sectionKey returns every existing locale row', async () => {
    getSectionUseCase.execute.mockResolvedValue([buildSection()]);

    const response = await request(server())
      .get('/content/sections/accueil/hero')
      .set('Authorization', 'Bearer valid-token')
      .expect(200);

    expect(getSectionUseCase.execute).toHaveBeenCalledWith('accueil', 'hero');
    expect(response.body).toHaveLength(1);
  });

  it('PATCH /content/sections/:page/:sectionKey saves a draft and passes the acting user', async () => {
    saveSectionDraftUseCase.execute.mockResolvedValue(buildSection({ titleText: 'Nouveau titre' }));

    const response = await request(server())
      .patch('/content/sections/accueil/hero')
      .set('Authorization', 'Bearer valid-token')
      .send({ locale: 'FR', titleText: 'Nouveau titre' })
      .expect(200);

    expect(saveSectionDraftUseCase.execute).toHaveBeenCalledWith(
      expect.objectContaining({ page: 'accueil', sectionKey: 'hero', locale: 'FR', titleText: 'Nouveau titre', actorId: 'admin-1' }),
    );
    expect(response.body).toMatchObject({ titleText: 'Nouveau titre' });
  });

  it('PATCH /content/sections/:page/:sectionKey rejects an invalid locale with 400', async () => {
    await request(server())
      .patch('/content/sections/accueil/hero')
      .set('Authorization', 'Bearer valid-token')
      .send({ locale: 'EN', titleText: 'x' })
      .expect(400);

    expect(saveSectionDraftUseCase.execute).not.toHaveBeenCalled();
  });

  it('POST /content/sections/:page/:sectionKey/publish publishes explicitly', async () => {
    publishSectionUseCase.execute.mockResolvedValue(buildSection({ status: 'PUBLISHED' }));

    const response = await request(server())
      .post('/content/sections/accueil/hero/publish')
      .set('Authorization', 'Bearer valid-token')
      .send({ locale: 'FR' })
      .expect(201);

    expect(publishSectionUseCase.execute).toHaveBeenCalledWith({
      page: 'accueil',
      sectionKey: 'hero',
      locale: 'FR',
      actorId: 'admin-1',
    });
    expect(response.body).toMatchObject({ status: 'PUBLISHED' });
  });

  it('POST /content/sections/:id/versions/:versionId/restore restores a version', async () => {
    restoreSectionVersionUseCase.execute.mockResolvedValue(buildSection({ titleText: 'Ancien titre' }));

    const response = await request(server())
      .post('/content/sections/section-1/versions/version-1/restore')
      .set('Authorization', 'Bearer valid-token')
      .expect(201);

    expect(restoreSectionVersionUseCase.execute).toHaveBeenCalledWith({
      pageSectionId: 'section-1',
      versionId: 'version-1',
      actorId: 'admin-1',
    });
    expect(response.body).toMatchObject({ titleText: 'Ancien titre' });
  });
});
