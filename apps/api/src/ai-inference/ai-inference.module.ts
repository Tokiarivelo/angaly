import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from '../auth/auth.module';
import { AdminAiSettingsModule } from '../admin-ai-settings/admin-ai-settings.module';

import { AI_CONVERSATION_REPOSITORY } from './domain/repositories/ai-conversation.repository';
import { PrismaAIConversationRepository } from './infrastructure/repositories/prisma-ai-conversation.repository';
import { AiServiceHttpClient } from './infrastructure/services/ai-service-http-client';

import { SuggestPatternParametersUseCase } from './application/use-cases/suggest-pattern-parameters.use-case';
import { EstimateMissingMeasurementsUseCase } from './application/use-cases/estimate-missing-measurements.use-case';
import { SendAssistantMessageUseCase } from './application/use-cases/send-assistant-message.use-case';
import { GetConversationHistoryUseCase } from './application/use-cases/get-conversation-history.use-case';

import { AiAssistantController } from './presentation/controllers/ai-assistant.controller';
import { AiInspirationController } from './presentation/controllers/ai-inspiration.controller';
import { AiPatternSuggestionsController } from './presentation/controllers/ai-pattern-suggestions.controller';
import { AiAvailableModelsController } from './presentation/controllers/ai-available-models.controller';

@Module({
  imports: [PrismaModule, ConfigModule, AuthModule, AdminAiSettingsModule],
  controllers: [
    AiAssistantController,
    AiInspirationController,
    AiPatternSuggestionsController,
    AiAvailableModelsController,
  ],
  providers: [
    {
      provide: AI_CONVERSATION_REPOSITORY,
      useClass: PrismaAIConversationRepository,
    },
    AiServiceHttpClient,
    SuggestPatternParametersUseCase,
    EstimateMissingMeasurementsUseCase,
    SendAssistantMessageUseCase,
    GetConversationHistoryUseCase,
  ],
  // Exported for the `patterns` module (generation flow can request AI-estimated measurements)
  exports: [SuggestPatternParametersUseCase, EstimateMissingMeasurementsUseCase],
})
export class AiInferenceModule {}
