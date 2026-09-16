/**
 * Domain-local mirror of `MessageSenderRole` (`@angaly/types` / `schema.prisma`)
 * — the Domain layer must not import `@angaly/types` (.cursor/rules/003-nestjs-
 * clean-arch.mdc), keep both in sync by hand.
 */
export const MESSAGE_SENDER_ROLES = ['CLIENT', 'STAFF'] as const;

export type MessageSenderRole = (typeof MESSAGE_SENDER_ROLES)[number];

export function isMessageSenderRole(value: string): value is MessageSenderRole {
  return (MESSAGE_SENDER_ROLES as readonly string[]).includes(value);
}

export interface MessageProps {
  id: string;
  conversationId: string;
  senderRole: MessageSenderRole;
  senderUserId: string;
  content: string;
  isRead: boolean;
  createdAt: Date;
}

/** Invariants: conversationId/senderUserId/content non-empty, senderRole recognized. */
export class MessageEntity {
  private constructor(private readonly props: MessageProps) {}

  static create(props: MessageProps): MessageEntity {
    if (!props.conversationId.trim()) {
      throw new Error('Message.conversationId must not be empty');
    }
    if (!isMessageSenderRole(props.senderRole)) {
      throw new Error(`Message.senderRole must be one of ${MESSAGE_SENDER_ROLES.join(', ')}`);
    }
    if (!props.senderUserId.trim()) {
      throw new Error('Message.senderUserId must not be empty');
    }
    if (!props.content.trim()) {
      throw new Error('Message.content must not be empty');
    }
    return new MessageEntity(props);
  }

  get id(): string {
    return this.props.id;
  }

  get conversationId(): string {
    return this.props.conversationId;
  }

  get senderRole(): MessageSenderRole {
    return this.props.senderRole;
  }

  get senderUserId(): string {
    return this.props.senderUserId;
  }

  get content(): string {
    return this.props.content;
  }

  get isRead(): boolean {
    return this.props.isRead;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  markAsRead(): void {
    this.props.isRead = true;
  }
}
