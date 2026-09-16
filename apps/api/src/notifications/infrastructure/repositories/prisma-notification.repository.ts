import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../../prisma/prisma.service';
import { NotificationEntity } from '../../domain/entities/notification.entity';
import { INotificationRepository } from '../../domain/repositories/notification.repository';
import { NotificationMapper } from '../mappers/notification.mapper';

@Injectable()
export class PrismaNotificationRepository implements INotificationRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(notification: NotificationEntity): Promise<void> {
    await this.prisma.notification.create({
      data: {
        id: notification.id,
        userId: notification.userId,
        type: notification.type,
        title: notification.title,
        body: notification.body,
        isRead: notification.isRead,
        relatedEntityType: notification.relatedEntityType ?? undefined,
        relatedEntityId: notification.relatedEntityId ?? undefined,
      },
    });
  }

  async findById(id: string): Promise<NotificationEntity | null> {
    const row = await this.prisma.notification.findUnique({ where: { id } });
    if (!row) return null;
    return NotificationMapper.toDomain(row);
  }

  async findByUserId(userId: string, unreadOnly = false): Promise<NotificationEntity[]> {
    const rows = await this.prisma.notification.findMany({
      where: { userId, ...(unreadOnly ? { isRead: false } : {}) },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map((row) => NotificationMapper.toDomain(row));
  }

  async markAsRead(id: string): Promise<void> {
    await this.prisma.notification.update({ where: { id }, data: { isRead: true } });
  }

  async markAllAsRead(userId: string): Promise<void> {
    await this.prisma.notification.updateMany({ where: { userId, isRead: false }, data: { isRead: true } });
  }
}
