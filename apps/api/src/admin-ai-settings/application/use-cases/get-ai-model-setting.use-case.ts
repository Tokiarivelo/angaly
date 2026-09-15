import { Inject, Injectable } from '@nestjs/common';
import {
  AI_MODEL_SETTING_REPOSITORY,
  IAiModelSettingRepository,
} from '../../domain/repositories/ai-model-setting.repository';
import { AiModelSetting } from '../../domain/entities/ai-model-setting.entity';

@Injectable()
export class GetAiModelSettingUseCase {
  constructor(
    @Inject(AI_MODEL_SETTING_REPOSITORY)
    private readonly repository: IAiModelSettingRepository,
  ) {}

  async execute(): Promise<AiModelSetting> {
    return this.repository.get();
  }
}
