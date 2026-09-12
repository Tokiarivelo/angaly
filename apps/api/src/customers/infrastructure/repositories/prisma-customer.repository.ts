import { Injectable } from '@nestjs/common';
import { Prisma } from '@angaly/database';

import { PrismaService } from '../../../prisma/prisma.service';
import { CustomerEntity } from '../../domain/entities/customer.entity';
import { ICustomerRepository, UpdateCustomerProfileInput } from '../../domain/repositories/customer.repository';
import { CustomerMapper } from '../mappers/customer.mapper';

export const CUSTOMER_SELECT = {
  id: true,
  userId: true,
  firstName: true,
  lastName: true,
  phone: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.CustomerSelect;

export type CustomerRecord = Prisma.CustomerGetPayload<{ select: typeof CUSTOMER_SELECT }>;

@Injectable()
export class PrismaCustomerRepository implements ICustomerRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByUserId(userId: string): Promise<CustomerEntity | null> {
    const record = await this.prisma.customer.findUnique({ where: { userId }, select: CUSTOMER_SELECT });
    return record ? CustomerMapper.toDomain(record) : null;
  }

  async findById(id: string): Promise<CustomerEntity | null> {
    const record = await this.prisma.customer.findUnique({ where: { id }, select: CUSTOMER_SELECT });
    return record ? CustomerMapper.toDomain(record) : null;
  }

  async update(id: string, changes: UpdateCustomerProfileInput): Promise<CustomerEntity> {
    const record = await this.prisma.customer.update({
      where: { id },
      data: changes,
      select: CUSTOMER_SELECT,
    });
    return CustomerMapper.toDomain(record);
  }

  async create(userId: string, data: { firstName: string; lastName: string; phone?: string | null }): Promise<CustomerEntity> {
    const record = await this.prisma.customer.create({
      data: {
        userId,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone ?? null,
      },
      select: CUSTOMER_SELECT,
    });
    return CustomerMapper.toDomain(record);
  }
}
