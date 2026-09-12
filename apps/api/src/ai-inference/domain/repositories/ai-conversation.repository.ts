import { AIConversationMessage } from '../entities/ai-conversation-message.entity';

export interface IAIConversationRepository {
  createMessage(
    role: 'USER' | 'ASSISTANT',
    message: string,
    customerId?: string,
    patternProjectId?: string,
  ): Promise<AIConversationMessage>;
  
  findHistory(
    customerId?: string,
    patternProjectId?: string,
  ): Promise<AIConversationMessage[]>;
}

export const AI_CONVERSATION_REPOSITORY = Symbol('IAIConversationRepository');
