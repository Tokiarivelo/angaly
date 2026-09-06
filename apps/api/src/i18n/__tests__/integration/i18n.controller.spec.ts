import type { Server } from 'node:http';

import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';

import { I18nModule } from '../../i18n.module';

describe('I18nController (integration)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [I18nModule] }).compile();
    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  function server(): Server {
    return app.getHttpServer() as Server;
  }

  it('GET /i18n/locales defaults to FR when nothing indicates a preference', async () => {
    const response = await request(server()).get('/i18n/locales').expect(200);

    expect(response.body).toEqual({ locales: ['FR', 'MG'], current: 'FR' });
  });

  it('GET /i18n/locales?locale=MG resolves the explicit query locale', async () => {
    const response = await request(server()).get('/i18n/locales').query({ locale: 'MG' }).expect(200);

    expect((response.body as { current: string }).current).toBe('MG');
  });

  it('GET /i18n/locales honors the Accept-Language header when no query locale is given', async () => {
    const response = await request(server())
      .get('/i18n/locales')
      .set('Accept-Language', 'mg,fr;q=0.5')
      .expect(200);

    expect((response.body as { current: string }).current).toBe('MG');
  });
});
