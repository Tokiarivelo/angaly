import { PrismaAiModelSettingRepository } from '../../infrastructure/repositories/prisma-ai-model-setting.repository';
import type { PrismaService } from '../../../prisma/prisma.service';

interface MockDelegate {
  upsert: jest.Mock;
}

function buildPrismaServiceMock(): { prisma: PrismaService; aiModelSetting: MockDelegate } {
  const aiModelSetting: MockDelegate = { upsert: jest.fn() };
  const prisma = { aiModelSetting } as unknown as PrismaService;
  return { prisma, aiModelSetting };
}

const ROW = {
  id: 'singleton',
  measurementModel: 'GEMINI',
  updatedById: null,
  updatedAt: new Date('2026-01-01'),
  createdAt: new Date('2026-01-01'),
};

describe('PrismaAiModelSettingRepository', () => {
  it('get() upserts the singleton row with defaults and returns it', async () => {
    const { prisma, aiModelSetting } = buildPrismaServiceMock();
    aiModelSetting.upsert.mockResolvedValue(ROW);

    const result = await new PrismaAiModelSettingRepository(prisma).get();

    expect(aiModelSetting.upsert).toHaveBeenCalledWith({
      where: { id: 'singleton' },
      create: { id: 'singleton' },
      update: {},
    });
    expect(result.measurementModel).toBe('GEMINI');
  });

  it('update() writes the new preference and the acting admin id', async () => {
    const { prisma, aiModelSetting } = buildPrismaServiceMock();
    aiModelSetting.upsert.mockResolvedValue({
      ...ROW,
      measurementModel: 'LOCAL_STATISTICAL',
      updatedById: 'admin-1',
    });

    const result = await new PrismaAiModelSettingRepository(prisma).update('LOCAL_STATISTICAL', 'admin-1');

    expect(aiModelSetting.upsert).toHaveBeenCalledWith({
      where: { id: 'singleton' },
      create: { id: 'singleton', measurementModel: 'LOCAL_STATISTICAL', updatedById: 'admin-1' },
      update: { measurementModel: 'LOCAL_STATISTICAL', updatedById: 'admin-1' },
    });
    expect(result.measurementModel).toBe('LOCAL_STATISTICAL');
    expect(result.updatedById).toBe('admin-1');
  });
});
