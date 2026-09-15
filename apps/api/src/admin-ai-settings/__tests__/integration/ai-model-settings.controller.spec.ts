import type { Server } from 'node:http';

import type { INestApplication } from '@nestjs/common';
import { ValidationPipe } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import request from 'supertest';

import { ACCESS_TOKEN_SERVICE } from '../../../auth/domain/services/access-token.service';
import { JwtAuthGuard } from '../../../auth/presentation/guards/jwt-auth.guard';
import { RolesGuard } from '../../../auth/presentation/guards/roles.guard';
import { GetAiModelSettingUseCase } from '../../application/use-cases/get-ai-model-setting.use-case';
import { UpdateAiModelSettingUseCase } from '../../application/use-cases/update-ai-model-setting.use-case';
import { AiModelSetting } from '../../domain/entities/ai-model-setting.entity';
import { AiModelSettingsController } from '../../presentation/controllers/ai-model-settings.controller';

describe('AiModelSettingsController (integration)', () => {
  let app: INestApplication;
  const getAiModelSettingUseCase = { execute: jest.fn() };
  const updateAiModelSettingUseCase = { execute: jest.fn() };
  const accessTokenService = { sign: jest.fn(), verify: jest.fn() };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [AiModelSettingsController],
      providers: [
        { provide: GetAiModelSettingUseCase, useValue: getAiModelSettingUseCase },
        { provide: UpdateAiModelSettingUseCase, useValue: updateAiModelSettingUseCase },
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

  it('GET /admin/ai-settings returns the current preference for an ADMIN', async () => {
    getAiModelSettingUseCase.execute.mockResolvedValue(
      new AiModelSetting('singleton', 'GEMINI', null, new Date('2026-01-01'), new Date('2026-01-01')),
    );

    const response = await request(server())
      .get('/admin/ai-settings')
      .set('Authorization', 'Bearer valid-token')
      .expect(200);

    expect(response.body).toMatchObject({ measurementModel: 'GEMINI' });
  });

  it('GET /admin/ai-settings returns 403 for a non-ADMIN role', async () => {
    accessTokenService.verify.mockReturnValue({ sub: 'client-1', role: 'CLIENT' });

    await request(server())
      .get('/admin/ai-settings')
      .set('Authorization', 'Bearer valid-token')
      .expect(403);

    expect(getAiModelSettingUseCase.execute).not.toHaveBeenCalled();
  });

  it('PATCH /admin/ai-settings updates the preference and records the acting admin', async () => {
    updateAiModelSettingUseCase.execute.mockResolvedValue(
      new AiModelSetting('singleton', 'LOCAL_STATISTICAL', 'admin-1', new Date('2026-01-02'), new Date('2026-01-01')),
    );

    const response = await request(server())
      .patch('/admin/ai-settings')
      .set('Authorization', 'Bearer valid-token')
      .send({ measurementModel: 'LOCAL_STATISTICAL' })
      .expect(200);

    expect(updateAiModelSettingUseCase.execute).toHaveBeenCalledWith('LOCAL_STATISTICAL', 'admin-1');
    expect(response.body).toMatchObject({ measurementModel: 'LOCAL_STATISTICAL', updatedById: 'admin-1' });
  });

  it('PATCH /admin/ai-settings rejects an unknown model value with 400', async () => {
    await request(server())
      .patch('/admin/ai-settings')
      .set('Authorization', 'Bearer valid-token')
      .send({ measurementModel: 'NOT_A_MODEL' })
      .expect(400);

    expect(updateAiModelSettingUseCase.execute).not.toHaveBeenCalled();
  });
});
