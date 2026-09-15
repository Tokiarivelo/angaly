import { BadRequestException, ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { PaymentMethod, PaymentStatus } from '@angaly/types';
import { randomUUID } from 'crypto';

import { CUSTOMER_REPOSITORY, ICustomerRepository } from '../../../customers/domain/repositories/customer.repository';
import { PrismaService } from '../../../prisma/prisma.service';
import { Payment } from '../../domain/entities/payment.entity';
import { IPaymentProviderPort, PAYMENT_PROVIDER_FACTORY_TOKEN } from '../../domain/ports/payment-provider.port';
import { IPaymentRepository, PAYMENT_REPOSITORY_TOKEN } from '../../domain/repositories/payment.repository';
import { resolveCustomerId } from '../lib/resolve-customer-id';

export interface InitiatePaymentCommand {
  userId: string;
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
    @Inject(CUSTOMER_REPOSITORY)
    private readonly customerRepository: ICustomerRepository,
    private readonly prisma: PrismaService,
  ) {}

  async execute(command: InitiatePaymentCommand): Promise<Payment> {
    const order = await this.prisma.order.findUnique({
      where: { id: command.orderId },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    const customerId = await resolveCustomerId(this.customerRepository, command.userId);
    if (order.customerId !== customerId) {
      throw new ForbiddenException('This order does not belong to the current user');
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
