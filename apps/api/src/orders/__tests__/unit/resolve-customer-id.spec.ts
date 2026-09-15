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

  it('throws NotFoundException when no Customer profile exists and the repository cannot auto-provision one', async () => {
    const repository = buildRepository(null);
    repository.create = undefined;

    await expect(resolveCustomerId(repository, 'user-1')).rejects.toThrow(NotFoundException);
  });

  it('auto-provisions a Customer profile for a userId with none yet (e.g. a staff account)', async () => {
    const repository = buildRepository(null);
    const created = CustomerEntity.create({
      id: 'customer-auto',
      userId: 'staff-user',
      firstName: 'Compte',
      lastName: 'ANGALY',
      phone: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    repository.create = jest.fn().mockResolvedValue(created);

    const customerId = await resolveCustomerId(repository, 'staff-user');

    expect(customerId).toBe('customer-auto');
    expect(repository.create).toHaveBeenCalledWith('staff-user', { firstName: 'Compte', lastName: 'ANGALY' });
  });

  it('falls back to a concurrently-created Customer row if create() races and fails', async () => {
    const repository = buildRepository(null);
    repository.create = jest.fn().mockRejectedValue(new Error('unique constraint violation'));
    const raceWinner = CustomerEntity.create({
      id: 'customer-race',
      userId: 'staff-user',
      firstName: 'Compte',
      lastName: 'ANGALY',
      phone: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    repository.findByUserId = jest.fn().mockResolvedValueOnce(null).mockResolvedValueOnce(raceWinner);

    const customerId = await resolveCustomerId(repository, 'staff-user');

    expect(customerId).toBe('customer-race');
  });
});
