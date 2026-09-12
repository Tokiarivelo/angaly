import { Inject, Injectable, BadRequestException } from '@nestjs/common';
import { IPaymentRepository, PAYMENT_REPOSITORY_TOKEN } from '../../domain/repositories/payment.repository';
import { PrismaService } from '../../../prisma/prisma.service';
import { OrderStatus } from '@angaly/types';

export interface ConfirmPaymentCommand {
  paymentId: string;
  transactionRef?: string;
}

@Injectable()
export class ConfirmPaymentUseCase {
  constructor(
    @Inject(PAYMENT_REPOSITORY_TOKEN)
    private readonly paymentRepository: IPaymentRepository,
    private readonly prisma: PrismaService,
  ) {}

  async execute(command: ConfirmPaymentCommand): Promise<void> {
    const payment = await this.paymentRepository.findById(command.paymentId);
    
    if (!payment) {
      throw new BadRequestException('Payment not found');
    }

    payment.confirm(command.transactionRef);
    
    // Save payment state and update order in a transaction
    await this.prisma.$transaction(async (tx) => {
      // 1. Update Payment
      await tx.payment.update({
        where: { id: payment.id },
        data: {
          status: payment.status,
          paidAt: payment.paidAt,
          transactionRef: payment.transactionRef,
        },
      });

      // 2. Update Order
      await tx.order.update({
        where: { id: payment.orderId },
        data: {
          status: OrderStatus.PAID,
        },
      });
    });
  }
}
