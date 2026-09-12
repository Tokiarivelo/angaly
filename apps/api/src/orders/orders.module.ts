import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { OrdersController } from './presentation/controllers/orders.controller';
import { CreateOrderFromCartUseCase } from './application/use-cases/create-order-from-cart.use-case';
import { PrismaOrderRepository } from './infrastructure/repositories/prisma-order.repository';
import { ORDER_REPOSITORY_TOKEN } from './domain/repositories/order.repository';

@Module({
  imports: [PrismaModule],
  controllers: [OrdersController],
  providers: [
    CreateOrderFromCartUseCase,
    {
      provide: ORDER_REPOSITORY_TOKEN,
      useClass: PrismaOrderRepository,
    },
  ],
  exports: [ORDER_REPOSITORY_TOKEN],
})
export class OrdersModule {}
