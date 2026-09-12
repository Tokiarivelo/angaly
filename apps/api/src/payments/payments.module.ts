import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { PaymentsController } from './presentation/controllers/payments.controller';
import { InitiatePaymentUseCase } from './application/use-cases/initiate-payment.use-case';
import { ConfirmPaymentUseCase } from './application/use-cases/confirm-payment.use-case';
import { PrismaPaymentRepository } from './infrastructure/repositories/prisma-payment.repository';
import { PAYMENT_REPOSITORY_TOKEN } from './domain/repositories/payment.repository';
import { PAYMENT_PROVIDER_FACTORY_TOKEN } from './domain/ports/payment-provider.port';
import { paymentProviderFactory } from './infrastructure/services/payment-provider.factory';

@Module({
  imports: [PrismaModule],
  controllers: [PaymentsController],
  providers: [
    InitiatePaymentUseCase,
    ConfirmPaymentUseCase,
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
