import type { ConversationEntity } from '../entities/conversation.entity';

export const CONVERSATION_REPOSITORY = Symbol('IConversationRepository');

export interface CreateConversationInput {
  id: string;
  customerId: string;
  atelierId: string;
  relatedEntityType: string | null;
  relatedEntityId: string | null;
  lastMessagePreview: string;
  lastMessageAt: Date;
}

export interface IConversationRepository {
  findById: (id: string) => Promise<ConversationEntity | null>;
  /** Backs the find-or-create "lazy new conversation" flow — one open `Conversation` per (customer, atelier) pair. */
  findByCustomerAndAtelier: (customerId: string, atelierId: string) => Promise<ConversationEntity | null>;
  /** Newest first (by `lastMessageAt`). */
  findByCustomerId: (customerId: string) => Promise<ConversationEntity[]>;
  /** Newest first (by `lastMessageAt`) — staff sees every conversation. */
  findAll: () => Promise<ConversationEntity[]>;
  create: (input: CreateConversationInput) => Promise<ConversationEntity>;
  updateLastMessage: (id: string, preview: string, at: Date) => Promise<void>;
}
