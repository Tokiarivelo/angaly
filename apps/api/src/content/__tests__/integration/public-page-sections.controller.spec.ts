import type { Server } from 'node:http';

import type { INestApplication } from '@nestjs/common';
import { ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';

import { ListPublishedSectionsUseCase } from '../../application/use-cases/list-published-sections.use-case';
import { PageSectionEntity } from '../../domain/entities/page-section.entity';
import { PublicPageSectionsController } from '../../presentation/controllers/public-page-sections.controller';

function buildSection(overrides: Partial<Parameters<typeof PageSectionEntity.create>[0]> = {}) {
  return PageSectionEntity.create({
    id: 'section-1',
    page: 'accueil',
    sectionKey: 'hero',
    locale: 'FR',
    titleText: 'ANGALY',
    subtitleText: "L'élégance, créée pour vous.",
    bodyText: null,
    ctaPrimaryLabel: null,
    ctaSecondaryLabel: null,
    dataJson: { eyebrow: 'MAISON DE COUTURE — MADAGASCAR' },
    mediaId: null,
    status: 'PUBLISHED',
    updatedById: 'admin-1',
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    ...overrides,
  });
}

describe('PublicPageSectionsController (integration)', () => {
  let app: INestApplication;
  const listPublishedSectionsUseCase = { execute: jest.fn() };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [PublicPageSectionsController],
      providers: [{ provide: ListPublishedSectionsUseCase, useValue: listPublishedSectionsUseCase }],
    }).compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
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

  it('GET /content/public/:page requires no Authorization header', async () => {
    listPublishedSectionsUseCase.execute.mockResolvedValue([buildSection()]);

    const response = await request(server()).get('/content/public/accueil').expect(200);

    expect(listPublishedSectionsUseCase.execute).toHaveBeenCalledWith('accueil', undefined);
    expect(response.body).toEqual([
      {
        page: 'accueil',
        sectionKey: 'hero',
        locale: 'FR',
        titleText: 'ANGALY',
        subtitleText: "L'élégance, créée pour vous.",
        bodyText: null,
        ctaPrimaryLabel: null,
        ctaSecondaryLabel: null,
        dataJson: { eyebrow: 'MAISON DE COUTURE — MADAGASCAR' },
        mediaId: null,
        updatedAt: '2026-01-01T00:00:00.000Z',
      },
    ]);
  });

  it('never leaks `status` or `updatedById` in the response body', async () => {
    listPublishedSectionsUseCase.execute.mockResolvedValue([buildSection()]);

    const response = await request(server()).get('/content/public/accueil').expect(200);
    const [section] = response.body as [Record<string, unknown>];

    expect(section).not.toHaveProperty('status');
    expect(section).not.toHaveProperty('updatedById');
  });

  it('forwards the ?locale= query param to the use-case', async () => {
    listPublishedSectionsUseCase.execute.mockResolvedValue([]);

    await request(server()).get('/content/public/accueil?locale=MG').expect(200);

    expect(listPublishedSectionsUseCase.execute).toHaveBeenCalledWith('accueil', 'MG');
  });

  it('rejects an invalid locale with 400', async () => {
    await request(server()).get('/content/public/accueil?locale=EN').expect(400);

    expect(listPublishedSectionsUseCase.execute).not.toHaveBeenCalled();
  });

  it('only ever surfaces what the use-case (PUBLISHED-scoped) resolves — an empty result for a-propos with nothing published', async () => {
    listPublishedSectionsUseCase.execute.mockResolvedValue([]);

    const response = await request(server()).get('/content/public/a-propos').expect(200);

    expect(response.body).toEqual([]);
  });
});
