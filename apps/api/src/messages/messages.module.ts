import { Module } from '@nestjs/common';

import { AteliersModule } from '../ateliers/ateliers.module';
import { AuthModule } from '../auth/auth.module';
import { CustomersModule } from '../customers/customers.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { PrismaModule } from '../prisma/prisma.module';
import { GetConversationThreadUseCase } from './application/use-cases/get-conversation-thread.use-case';
import { ListMyConversationsUseCase } from './application/use-cases/list-my-conversations.use-case';
import { SendMessageUseCase } from './application/use-cases/send-message.use-case';
import { StartConversationUseCase } from './application/use-cases/start-conversation.use-case';
import { CONVERSATION_REPOSITORY } from './domain/repositories/conversation.repository';
import { MESSAGE_REPOSITORY } from './domain/repositories/message.repository';
import { PrismaConversationRepository } from './infrastructure/repositories/prisma-conversation.repository';
import { PrismaMessageRepository } from './infrastructure/repositories/prisma-message.repository';
import { MessagesController } from './presentation/controllers/messages.controller';

// AuthModule: JwtAuthGuard/RolesGuard on every route.
// CustomersModule: CUSTOMER_REPOSITORY (resolves the caller's Customer.id from the JWT userId, owner checks).
// AteliersModule: ATELIER_REPOSITORY (validates atelierId when staff starts a new conversation).
// NotificationsModule: CreateNotificationUseCase (emits MESSAGE_RECEIVED best-effort when staff sends a message).
@Module({
  imports: [PrismaModule, AuthModule, CustomersModule, AteliersModule, NotificationsModule],
  controllers: [MessagesController],
  providers: [
    ListMyConversationsUseCase,
    GetConversationThreadUseCase,
    SendMessageUseCase,
    StartConversationUseCase,
    {
      provide: CONVERSATION_REPOSITORY,
      useClass: PrismaConversationRepository,
    },
    {
      provide: MESSAGE_REPOSITORY,
      useClass: PrismaMessageRepository,
    },
  ],
  exports: [CONVERSATION_REPOSITORY, MESSAGE_REPOSITORY],
})
export class MessagesModule {}
