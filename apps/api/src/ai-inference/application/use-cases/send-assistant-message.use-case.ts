import { Injectable, Inject } from '@nestjs/common';
import { IAIConversationRepository, AI_CONVERSATION_REPOSITORY } from '../../domain/repositories/ai-conversation.repository';
import { AiServiceHttpClient } from '../../infrastructure/services/ai-service-http-client';
import { AIConversationMessage } from '../../domain/entities/ai-conversation-message.entity';

@Injectable()
export class SendAssistantMessageUseCase {
  constructor(
    @Inject(AI_CONVERSATION_REPOSITORY)
    private readonly conversationRepo: IAIConversationRepository,
    private readonly aiClient: AiServiceHttpClient,
  ) {}

  async execute(
    customerId: string,
    messageText: string,
    patternProjectId?: string,
  ): Promise<AIConversationMessage> {
    // Save USER message
    await this.conversationRepo.createMessage('USER', messageText, customerId, patternProjectId);

    // Get ASSISTANT response
    const aiResponseText = await this.aiClient.sendMessageToAssistant(messageText);

    // Save ASSISTANT message
    const aiMessage = await this.conversationRepo.createMessage('ASSISTANT', aiResponseText, customerId, patternProjectId);

    return aiMessage;
  }
}
