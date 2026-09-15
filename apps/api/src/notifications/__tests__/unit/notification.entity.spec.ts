import { NotificationEntity } from '../../domain/entities/notification.entity';

function sampleProps(overrides: Partial<Parameters<typeof NotificationEntity.create>[0]> = {}) {
  return {
    id: 'notif-1',
    userId: 'user-1',
    type: 'ORDER_STATUS_CHANGED' as const,
    title: 'Commande confirmée',
    body: 'Votre commande ANG-2026-0001 est confirmée.',
    isRead: false,
    relatedEntityType: 'Order',
    relatedEntityId: 'order-1',
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    ...overrides,
  };
}

describe('NotificationEntity', () => {
  it('creates a valid notification', () => {
    const notification = NotificationEntity.create(sampleProps());

    expect(notification.id).toBe('notif-1');
    expect(notification.userId).toBe('user-1');
    expect(notification.isRead).toBe(false);
  });

  it('rejects an empty userId', () => {
    expect(() => NotificationEntity.create(sampleProps({ userId: '  ' }))).toThrow('userId must not be empty');
  });

  it('rejects an unrecognized type', () => {
    expect(() =>
      // @ts-expect-error deliberately invalid for the test
      NotificationEntity.create(sampleProps({ type: 'NOT_A_TYPE' })),
    ).toThrow('type must be one of');
  });

  it('rejects an empty title', () => {
    expect(() => NotificationEntity.create(sampleProps({ title: '' }))).toThrow('title must not be empty');
  });

  it('rejects an empty body', () => {
    expect(() => NotificationEntity.create(sampleProps({ body: '  ' }))).toThrow('body must not be empty');
  });

  it('markAsRead() flips isRead to true', () => {
    const notification = NotificationEntity.create(sampleProps());

    notification.markAsRead();

    expect(notification.isRead).toBe(true);
  });
});
