/**
 * Domain-local mirror of `NotificationType` (`@angaly/types` / `schema.prisma`) —
 * the Domain layer must not import `@angaly/types` (.cursor/rules/003-nestjs-
 * clean-arch.mdc), keep both in sync by hand.
 */
export const NOTIFICATION_TYPES = [
  'APPOINTMENT_CONFIRMED',
  'APPOINTMENT_REMINDER',
  'APPOINTMENT_CANCELLED',
  'ORDER_STATUS_CHANGED',
  'QUOTE_RECEIVED',
  'PATTERN_STATUS_CHANGED',
  'MESSAGE_RECEIVED',
] as const;

export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

export function isNotificationType(value: string): value is NotificationType {
  return (NOTIFICATION_TYPES as readonly string[]).includes(value);
}

export interface NotificationProps {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  isRead: boolean;
  relatedEntityType: string | null;
  relatedEntityId: string | null;
  createdAt: Date;
}

/** Invariants: userId/title/body non-empty, type recognized. */
export class NotificationEntity {
  private constructor(private readonly props: NotificationProps) {}

  static create(props: NotificationProps): NotificationEntity {
    if (!props.userId.trim()) {
      throw new Error('Notification.userId must not be empty');
    }
    if (!isNotificationType(props.type)) {
      throw new Error(`Notification.type must be one of ${NOTIFICATION_TYPES.join(', ')}`);
    }
    if (!props.title.trim()) {
      throw new Error('Notification.title must not be empty');
    }
    if (!props.body.trim()) {
      throw new Error('Notification.body must not be empty');
    }
    return new NotificationEntity(props);
  }

  get id(): string {
    return this.props.id;
  }

  get userId(): string {
    return this.props.userId;
  }

  get type(): NotificationType {
    return this.props.type;
  }

  get title(): string {
    return this.props.title;
  }

  get body(): string {
    return this.props.body;
  }

  get isRead(): boolean {
    return this.props.isRead;
  }

  get relatedEntityType(): string | null {
    return this.props.relatedEntityType;
  }

  get relatedEntityId(): string | null {
    return this.props.relatedEntityId;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  markAsRead(): void {
    this.props.isRead = true;
  }
}
