import { Injectable, Inject } from '@nestjs/common';
import { IAIConversationRepository, AI_CONVERSATION_REPOSITORY } from '../../domain/repositories/ai-conversation.repository';
import { AIConversationMessage } from '../../domain/entities/ai-conversation-message.entity';

@Injectable()
export class GetConversationHistoryUseCase {
  constructor(
    @Inject(AI_CONVERSATION_REPOSITORY)
    private readonly conversationRepo: IAIConversationRepository,
  ) {}

  async execute(
    customerId: string,
    patternProjectId?: string,
  ): Promise<AIConversationMessage[]> {
    return this.conversationRepo.findHistory(customerId, patternProjectId);
  }
}
