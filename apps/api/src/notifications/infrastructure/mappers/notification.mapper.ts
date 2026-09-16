import type { Notification as PrismaNotification } from '@angaly/database';
import type { NotificationType as SharedNotificationType } from '@angaly/types';

import { NotificationEntity } from '../../domain/entities/notification.entity';
import { NotificationResponseDto } from '../../application/dtos/notification-response.dto';

export class NotificationMapper {
  static toDomain(row: PrismaNotification): NotificationEntity {
    return NotificationEntity.create({
      id: row.id,
      userId: row.userId,
      type: row.type,
      title: row.title,
      body: row.body,
      isRead: row.isRead,
      relatedEntityType: row.relatedEntityType,
      relatedEntityId: row.relatedEntityId,
      createdAt: row.createdAt,
    });
  }

  static toResponseDto(notification: NotificationEntity): NotificationResponseDto {
    const dto = new NotificationResponseDto();
    dto.id = notification.id;
    dto.userId = notification.userId;
    dto.type = notification.type as unknown as SharedNotificationType;
    dto.title = notification.title;
    dto.body = notification.body;
    dto.isRead = notification.isRead;
    dto.relatedEntityType = notification.relatedEntityType;
    dto.relatedEntityId = notification.relatedEntityId;
    dto.createdAt = notification.createdAt.toISOString();
    return dto;
  }
}
