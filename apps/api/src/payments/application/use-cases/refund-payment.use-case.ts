import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { OrderStatus } from '@angaly/types';

import type { IOrderRepository } from '../../../orders/domain/repositories/order.repository';
import { ORDER_REPOSITORY_TOKEN } from '../../../orders/domain/repositories/order.repository';
import { PrismaService } from '../../../prisma/prisma.service';
import { Payment } from '../../domain/entities/payment.entity';
import { IPaymentProviderPort, PAYMENT_PROVIDER_FACTORY_TOKEN } from '../../domain/ports/payment-provider.port';
import { IPaymentRepository, PAYMENT_REPOSITORY_TOKEN } from '../../domain/repositories/payment.repository';

/** Staff only (enforced by `RolesGuard` at the controller) — full refund of a `PAID` payment, transitioning its order to `REFUNDED` in the same way `confirm-payment` transitions it to `PAID`. */
@Injectable()
export class RefundPaymentUseCase {
  constructor(
    @Inject(PAYMENT_REPOSITORY_TOKEN) private readonly paymentRepository: IPaymentRepository,
    @Inject(ORDER_REPOSITORY_TOKEN) private readonly orderRepository: IOrderRepository,
    @Inject(PAYMENT_PROVIDER_FACTORY_TOKEN) private readonly providerFactory: (method: Payment['method']) => IPaymentProviderPort,
    private readonly prisma: PrismaService,
  ) {}

  async execute(paymentId: string): Promise<Payment> {
    const payment = await this.paymentRepository.findById(paymentId);
    if (!payment) {
      throw new NotFoundException(`Payment ${paymentId} not found`);
    }

    const order = await this.orderRepository.findById(payment.orderId);
    if (!order) {
      throw new NotFoundException(`Order ${payment.orderId} not found`);
    }

    try {
      order.transitionTo(OrderStatus.REFUNDED);
    } catch (error) {
      throw new BadRequestException(error instanceof Error ? error.message : 'Invalid order status transition');
    }

    try {
      payment.refund();
    } catch (error) {
      throw new BadRequestException(error instanceof Error ? error.message : 'This payment cannot be refunded');
    }

    if (!payment.transactionRef) {
      throw new BadRequestException('Payment has no transactionRef to refund against');
    }

    const provider = this.providerFactory(payment.method);
    await provider.refund(payment.transactionRef, payment.amount);

    await this.prisma.$transaction(async (tx) => {
      await tx.payment.update({ where: { id: payment.id }, data: { status: payment.status } });
      await tx.order.update({ where: { id: order.id }, data: { status: order.status } });
    });

    return payment;
  }
}
