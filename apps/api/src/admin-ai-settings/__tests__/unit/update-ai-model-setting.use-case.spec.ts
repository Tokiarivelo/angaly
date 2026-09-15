import { UpdateAiModelSettingUseCase } from '../../application/use-cases/update-ai-model-setting.use-case';
import type { IAiModelSettingRepository } from '../../domain/repositories/ai-model-setting.repository';
import { AiModelSetting } from '../../domain/entities/ai-model-setting.entity';

describe('UpdateAiModelSettingUseCase', () => {
  it('delegates the update to the repository with the acting admin id', async () => {
    const updated = new AiModelSetting('singleton', 'LOCAL_STATISTICAL', 'admin-1', new Date(), new Date());
    const repository: jest.Mocked<IAiModelSettingRepository> = {
      get: jest.fn(),
      update: jest.fn().mockResolvedValue(updated),
    };

    const useCase = new UpdateAiModelSettingUseCase(repository);
    const result = await useCase.execute('LOCAL_STATISTICAL', 'admin-1');

    expect(repository.update).toHaveBeenCalledWith('LOCAL_STATISTICAL', 'admin-1');
    expect(result).toBe(updated);
  });
});
