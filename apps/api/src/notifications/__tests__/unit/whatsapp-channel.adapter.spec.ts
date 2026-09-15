import { NotificationEntity } from '../../domain/entities/notification.entity';
import { WhatsappChannelAdapter } from '../../infrastructure/services/whatsapp-channel.adapter';

describe('WhatsappChannelAdapter', () => {
  it('resolves without sending — no provider confirmed yet, kept as a stub only', async () => {
    const notification = NotificationEntity.create({
      id: 'notif-1',
      userId: 'user-1',
      type: 'APPOINTMENT_REMINDER',
      title: 'Rappel de rendez-vous',
      body: 'Votre rendez-vous approche.',
      isRead: false,
      relatedEntityType: null,
      relatedEntityId: null,
      createdAt: new Date(),
    });

    await expect(new WhatsappChannelAdapter().send(notification)).resolves.toBeUndefined();
  });
});
