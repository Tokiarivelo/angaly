import { Injectable } from '@nestjs/common';
import { IPaymentRepository } from '../../domain/repositories/payment.repository';
import { Payment } from '../../domain/entities/payment.entity';
import { PrismaService } from '../../../prisma/prisma.service';
import { PaymentMethod, PaymentStatus } from '@angaly/types';
import { Payment as PrismaPayment } from '@angaly/database';

@Injectable()
export class PrismaPaymentRepository implements IPaymentRepository {
  constructor(private readonly prisma: PrismaService) {}

  private mapToDomain(record: PrismaPayment): Payment {
    return new Payment(
      record.id,
      record.orderId,
      record.method as PaymentMethod,
      record.status as PaymentStatus,
      Number(record.amount),
      record.transactionRef,
      record.paidAt,
      record.createdAt,
    );
  }

  async create(payment: Payment): Promise<void> {
    await this.prisma.payment.create({
      data: {
        id: payment.id,
        orderId: payment.orderId,
        method: payment.method,
        status: payment.status,
        amount: payment.amount,
        transactionRef: payment.transactionRef,
        paidAt: payment.paidAt,
        createdAt: payment.createdAt,
      },
    });
  }

  async findById(id: string): Promise<Payment | null> {
    const record = await this.prisma.payment.findUnique({
      where: { id },
    });
    if (!record) return null;
    return this.mapToDomain(record);
  }

  async findByOrderId(orderId: string): Promise<Payment[]> {
    const records = await this.prisma.payment.findMany({
      where: { orderId },
      orderBy: { createdAt: 'desc' },
    });
    return records.map(r => this.mapToDomain(r));
  }

  async findByCustomerId(customerId: string): Promise<Payment[]> {
    const records = await this.prisma.payment.findMany({
      where: { order: { customerId } },
      orderBy: { createdAt: 'desc' },
    });
    return records.map((r) => this.mapToDomain(r));
  }

  async findAll(): Promise<Payment[]> {
    const records = await this.prisma.payment.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return records.map((r) => this.mapToDomain(r));
  }

  async update(payment: Payment): Promise<void> {
    await this.prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: payment.status,
        transactionRef: payment.transactionRef,
        paidAt: payment.paidAt,
      },
    });
  }
}
