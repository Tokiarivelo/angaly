import type { Server } from 'node:http';

import type { INestApplication } from '@nestjs/common';
import { ForbiddenException, NotFoundException, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';

import { ACCESS_TOKEN_SERVICE } from '../../../auth/domain/services/access-token.service';
import { JwtAuthGuard } from '../../../auth/presentation/guards/jwt-auth.guard';
import { NotificationEntity } from '../../domain/entities/notification.entity';
import { ListUserNotificationsUseCase } from '../../application/use-cases/list-user-notifications.use-case';
import { MarkAllReadUseCase } from '../../application/use-cases/mark-all-read.use-case';
import { MarkNotificationReadUseCase } from '../../application/use-cases/mark-notification-read.use-case';
import { NotificationsController } from '../../presentation/controllers/notifications.controller';

function sampleNotification(overrides: Partial<{ isRead: boolean }> = {}): NotificationEntity {
  return NotificationEntity.create({
    id: 'notif-1',
    userId: 'user-1',
    type: 'ORDER_STATUS_CHANGED',
    title: 'Statut mis à jour',
    body: 'Votre commande a changé de statut.',
    isRead: overrides.isRead ?? false,
    relatedEntityType: 'Order',
    relatedEntityId: 'order-1',
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
  });
}

describe('NotificationsController (integration)', () => {
  let app: INestApplication;
  const listUserNotificationsUseCase = { execute: jest.fn() };
  const markNotificationReadUseCase = { execute: jest.fn() };
  const markAllReadUseCase = { execute: jest.fn() };
  const accessTokenService = { sign: jest.fn(), verify: jest.fn() };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [NotificationsController],
      providers: [
        { provide: ListUserNotificationsUseCase, useValue: listUserNotificationsUseCase },
        { provide: MarkNotificationReadUseCase, useValue: markNotificationReadUseCase },
        { provide: MarkAllReadUseCase, useValue: markAllReadUseCase },
        JwtAuthGuard,
        { provide: ACCESS_TOKEN_SERVICE, useValue: accessTokenService },
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  function server(): Server {
    return app.getHttpServer() as Server;
  }

  function bearerFor(sub = 'user-1'): [string, string] {
    accessTokenService.verify.mockReturnValue({ sub, role: 'CLIENT' });
    return ['Authorization', 'Bearer valid-token'];
  }

  describe('GET /notifications', () => {
    it('rejects without a bearer token (401)', async () => {
      await request(server()).get('/notifications').expect(401);
    });

    it("returns the current user's notifications (200)", async () => {
      listUserNotificationsUseCase.execute.mockResolvedValue([sampleNotification()]);

      const [header, value] = bearerFor();
      const response = await request(server()).get('/notifications').set(header, value).expect(200);

      expect(response.body).toHaveLength(1);
      expect((response.body as { id: string }[])[0].id).toBe('notif-1');
      expect(listUserNotificationsUseCase.execute).toHaveBeenCalledWith('user-1', false);
    });

    it('forwards ?unread=true to the use-case', async () => {
      listUserNotificationsUseCase.execute.mockResolvedValue([]);

      const [header, value] = bearerFor();
      await request(server()).get('/notifications?unread=true').set(header, value).expect(200);

      expect(listUserNotificationsUseCase.execute).toHaveBeenCalledWith('user-1', true);
    });
  });

  describe('PATCH /notifications/:id/read', () => {
    it('marks a notification as read (200)', async () => {
      markNotificationReadUseCase.execute.mockResolvedValue(sampleNotification({ isRead: true }));

      const [header, value] = bearerFor();
      const response = await request(server()).patch('/notifications/notif-1/read').set(header, value).expect(200);

      expect((response.body as { isRead: boolean }).isRead).toBe(true);
      expect(markNotificationReadUseCase.execute).toHaveBeenCalledWith('notif-1', 'user-1');
    });

    it('returns 404 when the notification does not exist', async () => {
      markNotificationReadUseCase.execute.mockRejectedValue(new NotFoundException('Notification missing not found'));

      const [header, value] = bearerFor();
      await request(server()).patch('/notifications/missing/read').set(header, value).expect(404);
    });

    it("returns 403 for another user's notification", async () => {
      markNotificationReadUseCase.execute.mockRejectedValue(new ForbiddenException('This notification does not belong to the current user'));

      const [header, value] = bearerFor();
      await request(server()).patch('/notifications/notif-1/read').set(header, value).expect(403);
    });
  });

  describe('PATCH /notifications/read-all', () => {
    it('marks every notification as read (204)', async () => {
      markAllReadUseCase.execute.mockResolvedValue(undefined);

      const [header, value] = bearerFor();
      await request(server()).patch('/notifications/read-all').set(header, value).expect(204);

      expect(markAllReadUseCase.execute).toHaveBeenCalledWith('user-1');
    });
  });
});
