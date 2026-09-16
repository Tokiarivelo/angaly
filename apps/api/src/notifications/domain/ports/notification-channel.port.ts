import type { NotificationEntity } from '../entities/notification.entity';

export const NOTIFICATION_CHANNELS = Symbol('INotificationChannelPort[]');

/**
 * One implementation per delivery channel (email, in-app, WhatsApp…) — see
 * `docs/features/notifications.md`. `create-notification.use-case.ts` calls
 * every registered channel best-effort: one channel failing (e.g. SMTP
 * unreachable) never blocks another channel or the in-app persistence.
 */
export interface INotificationChannelPort {
  /** Channel name for logging (e.g. "email", "web", "whatsapp"). */
  readonly name: string;
  send: (notification: NotificationEntity) => Promise<void>;
}
