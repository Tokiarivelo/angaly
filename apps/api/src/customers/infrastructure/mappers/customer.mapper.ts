import { CustomerEntity } from '../../domain/entities/customer.entity';
import type { CustomerRecord } from '../repositories/prisma-customer.repository';

export class CustomerMapper {
  static toDomain(record: CustomerRecord): CustomerEntity {
    return CustomerEntity.create({
      id: record.id,
      userId: record.userId,
      firstName: record.firstName,
      lastName: record.lastName,
      phone: record.phone,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    });
  }
}
