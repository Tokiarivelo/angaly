import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';
import { CreateNotificationUseCase } from './application/use-cases/create-notification.use-case';
import { ListUserNotificationsUseCase } from './application/use-cases/list-user-notifications.use-case';
import { MarkAllReadUseCase } from './application/use-cases/mark-all-read.use-case';
import { MarkNotificationReadUseCase } from './application/use-cases/mark-notification-read.use-case';
import { NOTIFICATION_CHANNELS } from './domain/ports/notification-channel.port';
import { NOTIFICATION_REPOSITORY } from './domain/repositories/notification.repository';
import { EmailChannelAdapter } from './infrastructure/services/email-channel.adapter';
import { WebChannelAdapter } from './infrastructure/services/web-channel.adapter';
import { PrismaNotificationRepository } from './infrastructure/repositories/prisma-notification.repository';
import { NotificationsController } from './presentation/controllers/notifications.controller';

// AuthModule: JwtAuthGuard on every route + USER_REPOSITORY (EmailChannelAdapter resolves the recipient's email).
// WhatsappChannelAdapter deliberately NOT registered here — no provider confirmed yet, see
// infrastructure/services/whatsapp-channel.adapter.ts and docs/features/notifications.md.
@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [NotificationsController],
  providers: [
    CreateNotificationUseCase,
    ListUserNotificationsUseCase,
    MarkNotificationReadUseCase,
    MarkAllReadUseCase,
    EmailChannelAdapter,
    WebChannelAdapter,
    {
      provide: NOTIFICATION_REPOSITORY,
      useClass: PrismaNotificationRepository,
    },
    {
      provide: NOTIFICATION_CHANNELS,
      useFactory: (email: EmailChannelAdapter, web: WebChannelAdapter) => [email, web],
      inject: [EmailChannelAdapter, WebChannelAdapter],
    },
  ],
  exports: [NOTIFICATION_REPOSITORY, CreateNotificationUseCase],
})
export class NotificationsModule {}
