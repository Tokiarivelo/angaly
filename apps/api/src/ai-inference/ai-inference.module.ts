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

import { INSPIRATION_ANALYSIS_REPOSITORY } from './domain/repositories/inspiration-analysis.repository';
import { INSPIRATION_IMAGE_PREPROCESSOR } from './domain/services/inspiration-image-preprocessor.service';
import { PrismaInspirationAnalysisRepository } from './infrastructure/repositories/prisma-inspiration-analysis.repository';
import { SharpInspirationImagePreprocessor } from './infrastructure/services/sharp-inspiration-image-preprocessor';
import { AnalyzeInspirationImageUseCase } from './application/use-cases/analyze-inspiration-image.use-case';
import { AiProviderResolverService } from './application/services/ai-provider-resolver.service';

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
    { provide: INSPIRATION_ANALYSIS_REPOSITORY, useClass: PrismaInspirationAnalysisRepository },
    { provide: INSPIRATION_IMAGE_PREPROCESSOR, useClass: SharpInspirationImagePreprocessor },
    AiServiceHttpClient,
    AiProviderResolverService,
    AnalyzeInspirationImageUseCase,
    SuggestPatternParametersUseCase,
    EstimateMissingMeasurementsUseCase,
    SendAssistantMessageUseCase,
    GetConversationHistoryUseCase,
  ],
  // Exported for the `patterns` module (generation flow can request AI-estimated measurements)
  exports: [
    AiProviderResolverService,
    SuggestPatternParametersUseCase,
    EstimateMissingMeasurementsUseCase,
  ],
})
export class AiInferenceModule {}
