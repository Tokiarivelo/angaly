import { BadRequestException, Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { OrderStatus } from '@angaly/types';

import { CUSTOMER_REPOSITORY, ICustomerRepository } from '../../../customers/domain/repositories/customer.repository';
import { CreateNotificationUseCase } from '../../../notifications/application/use-cases/create-notification.use-case';
import type { Order } from '../../../orders/domain/entities/order.entity';
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
  private readonly logger = new Logger(ConfirmPaymentUseCase.name);

  constructor(
    @Inject(PAYMENT_REPOSITORY_TOKEN)
    private readonly paymentRepository: IPaymentRepository,
    @Inject(ORDER_REPOSITORY_TOKEN)
    private readonly orderRepository: IOrderRepository,
    @Inject(CUSTOMER_REPOSITORY)
    private readonly customerRepository: ICustomerRepository,
    private readonly createNotificationUseCase: CreateNotificationUseCase,
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

    await this.notifyOrderPaid(order);
  }

  /** Best-effort — a `notifications` outage must never fail a payment confirmation. */
  private async notifyOrderPaid(order: Order): Promise<void> {
    try {
      const customer = await this.customerRepository.findById(order.customerId);
      if (!customer) return;

      await this.createNotificationUseCase.execute({
        userId: customer.userId,
        type: 'ORDER_STATUS_CHANGED',
        title: 'Paiement confirmé',
        body: `Le paiement de votre commande ${order.orderNumber} est confirmé.`,
        relatedEntityType: 'Order',
        relatedEntityId: order.id,
      });
    } catch (error) {
      this.logger.warn(`Failed to emit ORDER_STATUS_CHANGED for order ${order.id}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}
