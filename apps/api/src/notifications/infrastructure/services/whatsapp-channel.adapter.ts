import { Injectable, Logger } from '@nestjs/common';

import { INotificationChannelPort } from '../../domain/ports/notification-channel.port';
import { NotificationEntity } from '../../domain/entities/notification.entity';

/**
 * NOT WIRED — no WhatsApp provider (Twilio, WhatsApp Business API, Meta Cloud
 * API…) is confirmed yet, see `docs/features/notifications.md` "Points
 * d'attention". Not registered in `NOTIFICATION_CHANNELS` in
 * `notifications.module.ts`; kept here only so `INotificationChannelPort`'s
 * shape is proven extensible without touching the Domain once a provider is
 * chosen.
 */
@Injectable()
export class WhatsappChannelAdapter implements INotificationChannelPort {
  readonly name = 'whatsapp';
  private readonly logger = new Logger(WhatsappChannelAdapter.name);

  send(notification: NotificationEntity): Promise<void> {
    this.logger.debug(`WhatsApp channel not configured — skipping notification ${notification.id}`);
    return Promise.resolve();
  }
}
