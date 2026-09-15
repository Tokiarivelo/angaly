import { NotificationEntity } from '../../domain/entities/notification.entity';
import type { INotificationChannelPort } from '../../domain/ports/notification-channel.port';
import type { INotificationRepository } from '../../domain/repositories/notification.repository';
import { CreateNotificationUseCase } from '../../application/use-cases/create-notification.use-case';

function buildRepository(): jest.Mocked<INotificationRepository> {
  return {
    create: jest.fn(),
    findById: jest.fn(),
    findByUserId: jest.fn(),
    markAsRead: jest.fn(),
    markAllAsRead: jest.fn(),
  };
}

function buildChannel(name: string, send: jest.Mock = jest.fn().mockResolvedValue(undefined)): INotificationChannelPort {
  return { name, send };
}

describe('CreateNotificationUseCase', () => {
  it('persists the notification and broadcasts on every channel', async () => {
    const repository = buildRepository();
    const emailSend = jest.fn().mockResolvedValue(undefined);
    const webSend = jest.fn().mockResolvedValue(undefined);
    const useCase = new CreateNotificationUseCase(repository, [buildChannel('email', emailSend), buildChannel('web', webSend)]);

    const notification = await useCase.execute({
      userId: 'user-1',
      type: 'APPOINTMENT_CONFIRMED',
      title: 'Rendez-vous confirmé',
      body: 'Votre rendez-vous du 12 janvier est confirmé.',
      relatedEntityType: 'Appointment',
      relatedEntityId: 'appt-1',
    });

    expect(notification).toBeInstanceOf(NotificationEntity);
    expect(repository.create).toHaveBeenCalledWith(notification);
    expect(emailSend).toHaveBeenCalledWith(notification);
    expect(webSend).toHaveBeenCalledWith(notification);
  });

  it('does not let one failing channel block another or throw', async () => {
    const repository = buildRepository();
    const failingSend = jest.fn().mockRejectedValue(new Error('SMTP down'));
    const okSend = jest.fn().mockResolvedValue(undefined);
    const useCase = new CreateNotificationUseCase(repository, [buildChannel('email', failingSend), buildChannel('web', okSend)]);

    await expect(
      useCase.execute({ userId: 'user-1', type: 'ORDER_STATUS_CHANGED', title: 'Statut mis à jour', body: 'Votre commande a changé de statut.' }),
    ).resolves.toBeInstanceOf(NotificationEntity);

    expect(repository.create).toHaveBeenCalledTimes(1);
    expect(okSend).toHaveBeenCalledTimes(1);
  });

  it('defaults relatedEntityType/relatedEntityId to null when omitted', async () => {
    const repository = buildRepository();
    const useCase = new CreateNotificationUseCase(repository, []);

    const notification = await useCase.execute({ userId: 'user-1', type: 'MESSAGE_RECEIVED', title: 'Nouveau message', body: 'Vous avez reçu un message.' });

    expect(notification.relatedEntityType).toBeNull();
    expect(notification.relatedEntityId).toBeNull();
  });
});
