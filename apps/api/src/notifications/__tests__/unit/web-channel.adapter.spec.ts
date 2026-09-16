import { NotificationEntity } from '../../domain/entities/notification.entity';
import { WebChannelAdapter } from '../../infrastructure/services/web-channel.adapter';

describe('WebChannelAdapter', () => {
  it('resolves without doing anything — persistence already happened', async () => {
    const notification = NotificationEntity.create({
      id: 'notif-1',
      userId: 'user-1',
      type: 'MESSAGE_RECEIVED',
      title: 'Nouveau message',
      body: 'Vous avez reçu un message.',
      isRead: false,
      relatedEntityType: null,
      relatedEntityId: null,
      createdAt: new Date(),
    });

    await expect(new WebChannelAdapter().send(notification)).resolves.toBeUndefined();
  });
});
