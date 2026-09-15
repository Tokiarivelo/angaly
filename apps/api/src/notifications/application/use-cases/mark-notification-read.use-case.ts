import { ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';

import { NotificationEntity } from '../../domain/entities/notification.entity';
import { INotificationRepository, NOTIFICATION_REPOSITORY } from '../../domain/repositories/notification.repository';

/** Owner only — a `Notification` belongs to a single `User`, never shared. */
@Injectable()
export class MarkNotificationReadUseCase {
  constructor(@Inject(NOTIFICATION_REPOSITORY) private readonly notificationRepository: INotificationRepository) {}

  async execute(notificationId: string, userId: string): Promise<NotificationEntity> {
    const notification = await this.notificationRepository.findById(notificationId);
    if (!notification) {
      throw new NotFoundException(`Notification ${notificationId} not found`);
    }
    if (notification.userId !== userId) {
      throw new ForbiddenException('This notification does not belong to the current user');
    }

    notification.markAsRead();
    await this.notificationRepository.markAsRead(notificationId);
    return notification;
  }
}
