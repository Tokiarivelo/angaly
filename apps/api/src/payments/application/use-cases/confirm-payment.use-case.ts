import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { OrderStatus } from '@angaly/types';

import type { IOrderRepository } from '../../../orders/domain/repositories/order.repository';
import { ORDER_REPOSITORY_TOKEN } from '../../../orders/domain/repositories/order.repository';
import { PrismaService } from '../../../prisma/prisma.service';
import { IPaymentRepository, PAYMENT_REPOSITORY_TOKEN } from '../../domain/repositories/payment.repository';

export interface ConfirmPaymentCommand {
  paymentId: string;
  transactionRef?: string;
}

/**
 * Manually confirms a payment (mock/`CASH_ON_DELIVERY` flow — see
 * `docs/features/payments.md`, a real webhook-signature-verified path is
 * still TODO) and propagates the order transition through
 * `Order.transitionTo()` — this used to write `OrderStatus.PAID` directly
 * via Prisma with no validation at all, so a payment confirmed on a
 * `CANCELLED` order would have silently resurrected it. `transitionTo()` is
 * called *before* either row is written, so an illegal transition fails
 * clean without touching the database; the two writes that follow (payment
 * + order) still happen inside one `$transaction`.
 */
@Injectable()
export class ConfirmPaymentUseCase {
  constructor(
    @Inject(PAYMENT_REPOSITORY_TOKEN)
    private readonly paymentRepository: IPaymentRepository,
    @Inject(ORDER_REPOSITORY_TOKEN)
    private readonly orderRepository: IOrderRepository,
    private readonly prisma: PrismaService,
  ) {}

  async execute(command: ConfirmPaymentCommand): Promise<void> {
    const payment = await this.paymentRepository.findById(command.paymentId);
    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    const order = await this.orderRepository.findById(payment.orderId);
    if (!order) {
      throw new NotFoundException(`Order ${payment.orderId} not found`);
    }

    try {
      order.transitionTo(OrderStatus.PAID);
    } catch (error) {
      throw new BadRequestException(error instanceof Error ? error.message : 'Invalid order status transition');
    }

    payment.confirm(command.transactionRef);

    await this.prisma.$transaction(async (tx) => {
      await tx.payment.update({
        where: { id: payment.id },
        data: {
          status: payment.status,
          paidAt: payment.paidAt,
          transactionRef: payment.transactionRef,
        },
      });

      await tx.order.update({
        where: { id: order.id },
        data: { status: order.status },
      });
    });
  }
}
