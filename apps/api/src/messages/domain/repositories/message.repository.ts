import type { MessageEntity } from '../entities/message.entity';

export const MESSAGE_REPOSITORY = Symbol('IMessageRepository');

export interface IMessageRepository {
  create: (message: MessageEntity) => Promise<void>;
  /** Oldest first (chronological reading order). */
  findByConversationId: (conversationId: string) => Promise<MessageEntity[]>;
  /** Marks every STAFF-authored, unread message in the conversation as read — the CLIENT's read receipt on opening a thread. */
  markStaffMessagesRead: (conversationId: string) => Promise<void>;
}
