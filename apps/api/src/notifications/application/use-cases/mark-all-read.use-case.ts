import { Inject, Injectable } from '@nestjs/common';

import { INotificationRepository, NOTIFICATION_REPOSITORY } from '../../domain/repositories/notification.repository';

@Injectable()
export class MarkAllReadUseCase {
  constructor(@Inject(NOTIFICATION_REPOSITORY) private readonly notificationRepository: INotificationRepository) {}

  async execute(userId: string): Promise<void> {
    await this.notificationRepository.markAllAsRead(userId);
  }
}
