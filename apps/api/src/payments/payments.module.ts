import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { CustomersModule } from '../customers/customers.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { OrdersModule } from '../orders/orders.module';
import { PrismaModule } from '../prisma/prisma.module';
import { PAYMENT_PROVIDER_FACTORY_TOKEN } from './domain/ports/payment-provider.port';
import { PAYMENT_REPOSITORY_TOKEN } from './domain/repositories/payment.repository';
import { paymentProviderFactory } from './infrastructure/services/payment-provider.factory';
import { PrismaPaymentRepository } from './infrastructure/repositories/prisma-payment.repository';
import { ConfirmPaymentUseCase } from './application/use-cases/confirm-payment.use-case';
import { GetPaymentStatusUseCase } from './application/use-cases/get-payment-status.use-case';
import { InitiatePaymentUseCase } from './application/use-cases/initiate-payment.use-case';
import { RefundPaymentUseCase } from './application/use-cases/refund-payment.use-case';
import { PaymentsController } from './presentation/controllers/payments.controller';

// AuthModule: JwtAuthGuard/RolesGuard on every route.
// CustomersModule: CUSTOMER_REPOSITORY (resolves the caller's Customer.id from the JWT userId, initiate-payment ownership check).
// OrdersModule: ORDER_REPOSITORY_TOKEN — confirm/refund transition the associated Order through Order.transitionTo(), never a raw status write.
// NotificationsModule: CreateNotificationUseCase (confirm-payment emits ORDER_STATUS_CHANGED).
@Module({
  imports: [PrismaModule, AuthModule, CustomersModule, OrdersModule, NotificationsModule],
  controllers: [PaymentsController],
  providers: [
    InitiatePaymentUseCase,
    ConfirmPaymentUseCase,
    GetPaymentStatusUseCase,
    RefundPaymentUseCase,
    {
      provide: PAYMENT_REPOSITORY_TOKEN,
      useClass: PrismaPaymentRepository,
    },
    {
      provide: PAYMENT_PROVIDER_FACTORY_TOKEN,
      useValue: paymentProviderFactory,
    },
  ],
})
export class PaymentsModule {}
