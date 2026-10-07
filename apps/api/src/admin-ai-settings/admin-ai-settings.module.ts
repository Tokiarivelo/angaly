import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { AI_MODEL_SETTING_REPOSITORY } from './domain/repositories/ai-model-setting.repository';
import { AI_PROVIDER_CONFIG_REPOSITORY } from './domain/repositories/ai-provider-config.repository';
import { SECRET_CIPHER } from './domain/services/secret-cipher.service';
import { PrismaAiModelSettingRepository } from './infrastructure/repositories/prisma-ai-model-setting.repository';
import { PrismaAiProviderConfigRepository } from './infrastructure/repositories/prisma-ai-provider-config.repository';
import { PROVIDER_MODELS_FETCHER } from './domain/services/provider-models-fetcher.service';
import { HttpProviderModelsFetcher } from './infrastructure/services/http-provider-models-fetcher';
import { ListAiProviderModelsUseCase } from './application/use-cases/list-ai-provider-models.use-case';
import { AesGcmSecretCipher } from './infrastructure/security/aes-gcm-secret-cipher';
import { GetAiModelSettingUseCase } from './application/use-cases/get-ai-model-setting.use-case';
import { UpdateAiModelSettingUseCase } from './application/use-cases/update-ai-model-setting.use-case';
import { UpdateAiRoutingUseCase } from './application/use-cases/update-ai-routing.use-case';
import { ListAiProvidersUseCase } from './application/use-cases/list-ai-providers.use-case';
import { UpsertAiProviderUseCase } from './application/use-cases/upsert-ai-provider.use-case';
import { RemoveAiProviderUseCase } from './application/use-cases/remove-ai-provider.use-case';
import { TestAiProviderUseCase } from './application/use-cases/test-ai-provider.use-case';
import { AiModelSettingsController } from './presentation/controllers/ai-model-settings.controller';
import { AdminAiProvidersController } from './presentation/controllers/admin-ai-providers.controller';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [AiModelSettingsController, AdminAiProvidersController],
  providers: [
    {
      provide: AI_MODEL_SETTING_REPOSITORY,
      useClass: PrismaAiModelSettingRepository,
    },
    {
      provide: AI_PROVIDER_CONFIG_REPOSITORY,
      useClass: PrismaAiProviderConfigRepository,
    },
    {
      provide: SECRET_CIPHER,
      useClass: AesGcmSecretCipher,
    },
    { provide: PROVIDER_MODELS_FETCHER, useClass: HttpProviderModelsFetcher },
    ListAiProviderModelsUseCase,
    GetAiModelSettingUseCase,
    UpdateAiModelSettingUseCase,
    UpdateAiRoutingUseCase,
    ListAiProvidersUseCase,
    UpsertAiProviderUseCase,
    RemoveAiProviderUseCase,
    TestAiProviderUseCase,
  ],
  // Exported so `ai-inference` can read the current routing and resolve provider credentials
  // when estimating missing measurements or generating pattern suggestions (one-way dependency).
  exports: [
    GetAiModelSettingUseCase,
    AI_PROVIDER_CONFIG_REPOSITORY,
    SECRET_CIPHER,
  ],
})
export class AdminAiSettingsModule {}
