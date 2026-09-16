import { ForbiddenException, NotFoundException } from '@nestjs/common';

import { NotificationEntity } from '../../domain/entities/notification.entity';
import type { INotificationRepository } from '../../domain/repositories/notification.repository';
import { MarkNotificationReadUseCase } from '../../application/use-cases/mark-notification-read.use-case';

function sampleNotification(userId = 'user-1'): NotificationEntity {
  return NotificationEntity.create({
    id: 'notif-1',
    userId,
    type: 'ORDER_STATUS_CHANGED',
    title: 'Statut mis à jour',
    body: 'Votre commande a changé de statut.',
    isRead: false,
    relatedEntityType: null,
    relatedEntityId: null,
    createdAt: new Date(),
  });
}

function buildRepository(notification: NotificationEntity | null): jest.Mocked<INotificationRepository> {
  return {
    create: jest.fn(),
    findById: jest.fn().mockResolvedValue(notification),
    findByUserId: jest.fn(),
    markAsRead: jest.fn(),
    markAllAsRead: jest.fn(),
  };
}

describe('MarkNotificationReadUseCase', () => {
  it('throws NotFoundException when the notification does not exist', async () => {
    const useCase = new MarkNotificationReadUseCase(buildRepository(null));

    await expect(useCase.execute('missing', 'user-1')).rejects.toThrow(NotFoundException);
  });

  it('throws ForbiddenException when the notification belongs to another user', async () => {
    const useCase = new MarkNotificationReadUseCase(buildRepository(sampleNotification('other-user')));

    await expect(useCase.execute('notif-1', 'user-1')).rejects.toThrow(ForbiddenException);
  });

  it('marks the notification as read for its owner', async () => {
    const repository = buildRepository(sampleNotification('user-1'));
    const useCase = new MarkNotificationReadUseCase(repository);

    const result = await useCase.execute('notif-1', 'user-1');

    expect(result.isRead).toBe(true);
    expect(repository.markAsRead).toHaveBeenCalledWith('notif-1');
  });
});
