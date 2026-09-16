import { Inject, Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'crypto';

import type { NotificationType } from '../../domain/entities/notification.entity';
import { NotificationEntity } from '../../domain/entities/notification.entity';
import { INotificationChannelPort, NOTIFICATION_CHANNELS } from '../../domain/ports/notification-channel.port';
import { INotificationRepository, NOTIFICATION_REPOSITORY } from '../../domain/repositories/notification.repository';

export interface CreateNotificationCommand {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  relatedEntityType?: string | null;
  relatedEntityId?: string | null;
}

/**
 * Persists the in-app `Notification` first, then broadcasts on every
 * registered channel (email, WhatsApp…) best-effort — a channel failing
 * (e.g. SMTP unreachable) never rolls back the persistence nor blocks the
 * other channels. This is the only entry point other modules should call to
 * emit a notification (`appointments`, `orders`/`payments`, `quotes`,
 * `patterns`) — never a direct write to the `Notification` table.
 */
@Injectable()
export class CreateNotificationUseCase {
  private readonly logger = new Logger(CreateNotificationUseCase.name);

  constructor(
    @Inject(NOTIFICATION_REPOSITORY) private readonly notificationRepository: INotificationRepository,
    @Inject(NOTIFICATION_CHANNELS) private readonly channels: INotificationChannelPort[],
  ) {}

  async execute(command: CreateNotificationCommand): Promise<NotificationEntity> {
    const notification = NotificationEntity.create({
      id: randomUUID(),
      userId: command.userId,
      type: command.type,
      title: command.title,
      body: command.body,
      isRead: false,
      relatedEntityType: command.relatedEntityType ?? null,
      relatedEntityId: command.relatedEntityId ?? null,
      createdAt: new Date(),
    });

    await this.notificationRepository.create(notification);

    await Promise.all(
      this.channels.map(async (channel) => {
        try {
          await channel.send(notification);
        } catch (error) {
          this.logger.warn(
            `Notification channel "${channel.name}" failed for notification ${notification.id}: ${error instanceof Error ? error.message : String(error)}`,
          );
        }
      }),
    );

    return notification;
  }
}
