import { NotificationEntity } from '../../domain/entities/notification.entity';
import type { INotificationRepository } from '../../domain/repositories/notification.repository';
import { ListUserNotificationsUseCase } from '../../application/use-cases/list-user-notifications.use-case';

function sampleNotification(): NotificationEntity {
  return NotificationEntity.create({
    id: 'notif-1',
    userId: 'user-1',
    type: 'ORDER_STATUS_CHANGED',
    title: 'Statut mis à jour',
    body: 'Votre commande a changé de statut.',
    isRead: false,
    relatedEntityType: null,
    relatedEntityId: null,
    createdAt: new Date(),
  });
}

function buildRepository(notifications: NotificationEntity[]): jest.Mocked<INotificationRepository> {
  return {
    create: jest.fn(),
    findById: jest.fn(),
    findByUserId: jest.fn().mockResolvedValue(notifications),
    markAsRead: jest.fn(),
    markAllAsRead: jest.fn(),
  };
}

describe('ListUserNotificationsUseCase', () => {
  it('lists every notification for a user by default', async () => {
    const repository = buildRepository([sampleNotification()]);
    const useCase = new ListUserNotificationsUseCase(repository);

    const result = await useCase.execute('user-1');

    expect(result).toHaveLength(1);
    expect(repository.findByUserId).toHaveBeenCalledWith('user-1', false);
  });

  it('forwards unreadOnly=true to the repository', async () => {
    const repository = buildRepository([]);
    const useCase = new ListUserNotificationsUseCase(repository);

    await useCase.execute('user-1', true);

    expect(repository.findByUserId).toHaveBeenCalledWith('user-1', true);
  });
});
