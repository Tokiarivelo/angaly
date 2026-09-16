import type { Notification as PrismaNotification } from '@angaly/database';

import { NotificationEntity } from '../../domain/entities/notification.entity';
import { NotificationMapper } from '../../infrastructure/mappers/notification.mapper';

function prismaRow(overrides: Partial<PrismaNotification> = {}): PrismaNotification {
  return {
    id: 'notif-1',
    userId: 'user-1',
    type: 'ORDER_STATUS_CHANGED',
    title: 'Statut mis à jour',
    body: 'Votre commande a changé de statut.',
    isRead: false,
    relatedEntityType: 'Order',
    relatedEntityId: 'order-1',
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    ...overrides,
  };
}

describe('NotificationMapper', () => {
  it('toDomain() maps a Prisma row to a domain entity', () => {
    const entity = NotificationMapper.toDomain(prismaRow());

    expect(entity).toBeInstanceOf(NotificationEntity);
    expect(entity.id).toBe('notif-1');
    expect(entity.relatedEntityType).toBe('Order');
  });

  it('toResponseDto() maps a domain entity to a plain DTO', () => {
    const entity = NotificationMapper.toDomain(prismaRow());

    const dto = NotificationMapper.toResponseDto(entity);

    expect(dto).toEqual({
      id: 'notif-1',
      userId: 'user-1',
      type: 'ORDER_STATUS_CHANGED',
      title: 'Statut mis à jour',
      body: 'Votre commande a changé de statut.',
      isRead: false,
      relatedEntityType: 'Order',
      relatedEntityId: 'order-1',
      createdAt: '2026-01-01T00:00:00.000Z',
    });
  });
});
