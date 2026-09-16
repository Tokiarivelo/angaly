export interface ConversationProps {
  id: string;
  customerId: string;
  atelierId: string;
  /** Denormalized read-model field hydrated by the mapper's join to `Atelier`, never persisted on `Conversation` itself. */
  atelierName: string;
  relatedEntityType: string | null;
  relatedEntityId: string | null;
  lastMessagePreview: string;
  lastMessageAt: Date;
  /** Count of STAFF-authored messages the owning CLIENT has not read yet — hydrated by the repository's aggregate query, never persisted. */
  unreadCount: number;
  createdAt: Date;
  updatedAt: Date;
}

/** Invariants: customerId/atelierId/atelierName/lastMessagePreview non-empty, unreadCount non-negative. */
export class ConversationEntity {
  private constructor(private readonly props: ConversationProps) {}

  static create(props: ConversationProps): ConversationEntity {
    if (!props.customerId.trim()) {
      throw new Error('Conversation.customerId must not be empty');
    }
    if (!props.atelierId.trim()) {
      throw new Error('Conversation.atelierId must not be empty');
    }
    if (!props.atelierName.trim()) {
      throw new Error('Conversation.atelierName must not be empty');
    }
    if (!props.lastMessagePreview.trim()) {
      throw new Error('Conversation.lastMessagePreview must not be empty');
    }
    if (props.unreadCount < 0) {
      throw new Error('Conversation.unreadCount must not be negative');
    }
    return new ConversationEntity(props);
  }

  get id(): string {
    return this.props.id;
  }

  get customerId(): string {
    return this.props.customerId;
  }

  get atelierId(): string {
    return this.props.atelierId;
  }

  get atelierName(): string {
    return this.props.atelierName;
  }

  get relatedEntityType(): string | null {
    return this.props.relatedEntityType;
  }

  get relatedEntityId(): string | null {
    return this.props.relatedEntityId;
  }

  get lastMessagePreview(): string {
    return this.props.lastMessagePreview;
  }

  get lastMessageAt(): Date {
    return this.props.lastMessageAt;
  }

  get unreadCount(): number {
    return this.props.unreadCount;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }
}
