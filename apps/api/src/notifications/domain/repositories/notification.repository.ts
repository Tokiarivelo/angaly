import type { NotificationEntity } from '../entities/notification.entity';

export const NOTIFICATION_REPOSITORY = Symbol('INotificationRepository');

export interface INotificationRepository {
  create: (notification: NotificationEntity) => Promise<void>;
  findById: (id: string) => Promise<NotificationEntity | null>;
  /** Newest first. `unreadOnly` filters to `isRead: false`. */
  findByUserId: (userId: string, unreadOnly?: boolean) => Promise<NotificationEntity[]>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: (userId: string) => Promise<void>;
}
