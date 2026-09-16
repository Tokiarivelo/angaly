import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { CustomersModule } from '../customers/customers.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { PrismaModule } from '../prisma/prisma.module';
import { CancelOrderUseCase } from './application/use-cases/cancel-order.use-case';
import { CreateOrderFromCartUseCase } from './application/use-cases/create-order-from-cart.use-case';
import { GetOrderUseCase } from './application/use-cases/get-order.use-case';
import { ListCustomerOrdersUseCase } from './application/use-cases/list-customer-orders.use-case';
import { UpdateOrderStatusUseCase } from './application/use-cases/update-order-status.use-case';
import { ORDER_REPOSITORY_TOKEN } from './domain/repositories/order.repository';
import { PrismaOrderRepository } from './infrastructure/repositories/prisma-order.repository';
import { OrdersController } from './presentation/controllers/orders.controller';

// AuthModule: JwtAuthGuard/RolesGuard on every route.
// CustomersModule: CUSTOMER_REPOSITORY (resolves the caller's Customer.id from the JWT userId).
// NotificationsModule: CreateNotificationUseCase (emits ORDER_STATUS_CHANGED on create/transition).
@Module({
  imports: [PrismaModule, AuthModule, CustomersModule, NotificationsModule],
  controllers: [OrdersController],
  providers: [
    CreateOrderFromCartUseCase,
    GetOrderUseCase,
    ListCustomerOrdersUseCase,
    UpdateOrderStatusUseCase,
    CancelOrderUseCase,
    {
      provide: ORDER_REPOSITORY_TOKEN,
      useClass: PrismaOrderRepository,
    },
  ],
  exports: [ORDER_REPOSITORY_TOKEN, UpdateOrderStatusUseCase],
})
export class OrdersModule {}
