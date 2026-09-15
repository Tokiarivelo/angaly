import type { PrismaService } from '../../../prisma/prisma.service';
import { NotificationEntity } from '../../domain/entities/notification.entity';
import { PrismaNotificationRepository } from '../../infrastructure/repositories/prisma-notification.repository';

interface MockNotificationDelegate {
  create: jest.Mock;
  findUnique: jest.Mock;
  findMany: jest.Mock;
  update: jest.Mock;
  updateMany: jest.Mock;
}

function buildPrismaServiceMock(): { prisma: PrismaService; notification: MockNotificationDelegate } {
  const notification: MockNotificationDelegate = {
    create: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
  };
  const prisma = { notification } as unknown as PrismaService;
  return { prisma, notification };
}

function notificationRecord() {
  return {
    id: 'notif-1',
    userId: 'user-1',
    type: 'ORDER_STATUS_CHANGED',
    title: 'Statut mis à jour',
    body: 'Votre commande a changé de statut.',
    isRead: false,
    relatedEntityType: null,
    relatedEntityId: null,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
  };
}

function domainNotification(): NotificationEntity {
  return NotificationEntity.create({
    id: 'notif-1',
    userId: 'user-1',
    type: 'ORDER_STATUS_CHANGED',
    title: 'Statut mis à jour',
    body: 'Votre commande a changé de statut.',
    isRead: false,
    relatedEntityType: null,
    relatedEntityId: null,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
  });
}

describe('PrismaNotificationRepository', () => {
  it('create() writes the notification', async () => {
    const { prisma, notification } = buildPrismaServiceMock();

    await new PrismaNotificationRepository(prisma).create(domainNotification());

    const call = notification.create.mock.calls[0]?.[0] as { data: { id: string; userId: string; type: string } };
    expect(call.data.id).toBe('notif-1');
    expect(call.data.userId).toBe('user-1');
    expect(call.data.type).toBe('ORDER_STATUS_CHANGED');
  });

  it('findById() returns null when no row matches', async () => {
    const { prisma, notification } = buildPrismaServiceMock();
    notification.findUnique.mockResolvedValue(null);

    expect(await new PrismaNotificationRepository(prisma).findById('missing')).toBeNull();
  });

  it('findById() maps a found row to a domain entity', async () => {
    const { prisma, notification } = buildPrismaServiceMock();
    notification.findUnique.mockResolvedValue(notificationRecord());

    const result = await new PrismaNotificationRepository(prisma).findById('notif-1');

    expect(result?.id).toBe('notif-1');
  });

  it('findByUserId() filters unread when unreadOnly is true', async () => {
    const { prisma, notification } = buildPrismaServiceMock();
    notification.findMany.mockResolvedValue([notificationRecord()]);

    await new PrismaNotificationRepository(prisma).findByUserId('user-1', true);

    expect(notification.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: 'user-1', isRead: false } }),
    );
  });

  it('findByUserId() does not filter by isRead when unreadOnly is false', async () => {
    const { prisma, notification } = buildPrismaServiceMock();
    notification.findMany.mockResolvedValue([]);

    await new PrismaNotificationRepository(prisma).findByUserId('user-1');

    expect(notification.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { userId: 'user-1' } }));
  });

  it('markAsRead() updates the single row', async () => {
    const { prisma, notification } = buildPrismaServiceMock();

    await new PrismaNotificationRepository(prisma).markAsRead('notif-1');

    expect(notification.update).toHaveBeenCalledWith({ where: { id: 'notif-1' }, data: { isRead: true } });
  });

  it('markAllAsRead() updates every unread row for a user', async () => {
    const { prisma, notification } = buildPrismaServiceMock();

    await new PrismaNotificationRepository(prisma).markAllAsRead('user-1');

    expect(notification.updateMany).toHaveBeenCalledWith({ where: { userId: 'user-1', isRead: false }, data: { isRead: true } });
  });
});
