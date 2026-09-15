import { Inject, Injectable } from '@nestjs/common';

import { NotificationEntity } from '../../domain/entities/notification.entity';
import { INotificationRepository, NOTIFICATION_REPOSITORY } from '../../domain/repositories/notification.repository';

@Injectable()
export class ListUserNotificationsUseCase {
  constructor(@Inject(NOTIFICATION_REPOSITORY) private readonly notificationRepository: INotificationRepository) {}

  async execute(userId: string, unreadOnly = false): Promise<NotificationEntity[]> {
    return this.notificationRepository.findByUserId(userId, unreadOnly);
  }
}
