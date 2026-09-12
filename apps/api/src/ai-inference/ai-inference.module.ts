import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { ConfigModule } from '@nestjs/config';

import { AI_CONVERSATION_REPOSITORY } from './domain/repositories/ai-conversation.repository';
import { PrismaAIConversationRepository } from './infrastructure/repositories/prisma-ai-conversation.repository';
import { AiServiceHttpClient } from './infrastructure/services/ai-service-http-client';

import { SuggestPatternParametersUseCase } from './application/use-cases/suggest-pattern-parameters.use-case';
import { SendAssistantMessageUseCase } from './application/use-cases/send-assistant-message.use-case';
import { GetConversationHistoryUseCase } from './application/use-cases/get-conversation-history.use-case';

import { AiAssistantController } from './presentation/controllers/ai-assistant.controller';
import { AiInspirationController } from './presentation/controllers/ai-inspiration.controller';

@Module({
  imports: [PrismaModule, ConfigModule],
  controllers: [AiAssistantController, AiInspirationController],
  providers: [
    {
      provide: AI_CONVERSATION_REPOSITORY,
      useClass: PrismaAIConversationRepository,
    },
    AiServiceHttpClient,
    SuggestPatternParametersUseCase,
    SendAssistantMessageUseCase,
    GetConversationHistoryUseCase,
  ],
  exports: [SuggestPatternParametersUseCase], // Exported for `patterns` module
})
export class AiInferenceModule {}
