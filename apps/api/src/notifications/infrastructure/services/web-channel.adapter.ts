import { Injectable } from '@nestjs/common';

import { INotificationChannelPort } from '../../domain/ports/notification-channel.port';
import { NotificationEntity } from '../../domain/entities/notification.entity';

/**
 * In-app channel — the "delivery" is the `Notification` row itself, already
 * persisted by `create-notification.use-case.ts` before any channel runs.
 * Registered mainly so the channel list stays explicit about what "web"
 * covers; there is no network call to make here.
 */
@Injectable()
export class WebChannelAdapter implements INotificationChannelPort {
  readonly name = 'web';

  async send(_notification: NotificationEntity): Promise<void> {
    // No-op — persistence already happened in create-notification.use-case.
  }
}
