import { AIConversationRole } from '@angaly/database';

export class AIConversationMessage {
  constructor(
    public readonly id: string,
    public readonly role: AIConversationRole,
    public readonly message: string,
    public readonly createdAt: Date,
    public readonly customerId?: string,
    public readonly patternProjectId?: string,
  ) {
    if (!message || message.trim() === '') {
      throw new Error('Message cannot be empty');
    }
  }
}
