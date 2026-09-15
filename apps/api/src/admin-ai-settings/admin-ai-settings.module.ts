import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { AI_MODEL_SETTING_REPOSITORY } from './domain/repositories/ai-model-setting.repository';
import { PrismaAiModelSettingRepository } from './infrastructure/repositories/prisma-ai-model-setting.repository';
import { GetAiModelSettingUseCase } from './application/use-cases/get-ai-model-setting.use-case';
import { UpdateAiModelSettingUseCase } from './application/use-cases/update-ai-model-setting.use-case';
import { AiModelSettingsController } from './presentation/controllers/ai-model-settings.controller';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [AiModelSettingsController],
  providers: [
    {
      provide: AI_MODEL_SETTING_REPOSITORY,
      useClass: PrismaAiModelSettingRepository,
    },
    GetAiModelSettingUseCase,
    UpdateAiModelSettingUseCase,
  ],
  // Exported so `ai-inference` can read the current preference when
  // estimating missing measurements — one-directional dependency, no cycle.
  exports: [GetAiModelSettingUseCase],
})
export class AdminAiSettingsModule {}
