import { Inject, Injectable, BadRequestException } from '@nestjs/common';
import { PaymentMethod, PaymentStatus } from '@angaly/types';
import { IPaymentRepository, PAYMENT_REPOSITORY_TOKEN } from '../../domain/repositories/payment.repository';
import { Payment } from '../../domain/entities/payment.entity';
import { PAYMENT_PROVIDER_FACTORY_TOKEN, IPaymentProviderPort } from '../../domain/ports/payment-provider.port';
import { randomUUID } from 'crypto';
import { PrismaService } from '../../../prisma/prisma.service';

export interface InitiatePaymentCommand {
  orderId: string;
  method: PaymentMethod;
}

@Injectable()
export class InitiatePaymentUseCase {
  constructor(
    @Inject(PAYMENT_REPOSITORY_TOKEN)
    private readonly paymentRepository: IPaymentRepository,
    @Inject(PAYMENT_PROVIDER_FACTORY_TOKEN)
    private readonly providerFactory: (method: PaymentMethod) => IPaymentProviderPort,
    private readonly prisma: PrismaService,
  ) {}

  async execute(command: InitiatePaymentCommand): Promise<Payment> {
    const order = await this.prisma.order.findUnique({
      where: { id: command.orderId },
    });

    if (!order) {
      throw new BadRequestException('Order not found');
    }

    if (order.status !== 'PENDING') {
      throw new BadRequestException('Order is not in PENDING status');
    }

    const provider = this.providerFactory(command.method);
    const amount = Number(order.total);
    
    const initResult = await provider.initiatePayment(command.orderId, amount);

    const payment = new Payment(
      randomUUID(),
      command.orderId,
      command.method,
      PaymentStatus.PENDING,
      amount,
      initResult.transactionRef,
      null,
      new Date(),
    );

    await this.paymentRepository.create(payment);
    return payment;
  }
}
