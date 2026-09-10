import { NotFoundException } from '@nestjs/common';

import { CustomerEntity } from '../../../customers/domain/entities/customer.entity';
import type { ICustomerRepository } from '../../../customers/domain/repositories/customer.repository';
import { resolveCustomerId } from '../../application/lib/resolve-customer-id';

function buildRepository(customer: CustomerEntity | null): jest.Mocked<ICustomerRepository> {
  return { findByUserId: jest.fn().mockResolvedValue(customer), findById: jest.fn(), update: jest.fn() };
}

describe('resolveCustomerId', () => {
  it('returns the Customer.id for a known userId', async () => {
    const customer = CustomerEntity.create({
      id: 'customer-1',
      userId: 'user-1',
      firstName: 'Nirina',
      lastName: 'Rakoto',
      phone: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    expect(await resolveCustomerId(buildRepository(customer), 'user-1')).toBe('customer-1');
  });

  it('throws NotFoundException when no Customer profile exists for the userId', async () => {
    await expect(resolveCustomerId(buildRepository(null), 'user-1')).rejects.toThrow(NotFoundException);
  });
});
