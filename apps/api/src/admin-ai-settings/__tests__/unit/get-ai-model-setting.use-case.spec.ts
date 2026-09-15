import { GetAiModelSettingUseCase } from '../../application/use-cases/get-ai-model-setting.use-case';
import type { IAiModelSettingRepository } from '../../domain/repositories/ai-model-setting.repository';
import { AiModelSetting } from '../../domain/entities/ai-model-setting.entity';

describe('GetAiModelSettingUseCase', () => {
  it('returns the setting from the repository', async () => {
    const setting = new AiModelSetting('singleton', 'GEMINI', null, new Date(), new Date());
    const repository: jest.Mocked<IAiModelSettingRepository> = {
      get: jest.fn().mockResolvedValue(setting),
      update: jest.fn(),
    };

    const useCase = new GetAiModelSettingUseCase(repository);
    const result = await useCase.execute();

    expect(result).toBe(setting);
    expect(repository.get).toHaveBeenCalled();
  });
});
