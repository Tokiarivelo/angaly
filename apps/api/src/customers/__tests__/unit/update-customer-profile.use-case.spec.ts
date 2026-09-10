import { NotFoundException } from '@nestjs/common';

import { CustomerEntity } from '../../domain/entities/customer.entity';
import { UpdateCustomerProfileUseCase } from '../../application/use-cases/update-customer-profile.use-case';
import type { ICustomerRepository } from '../../domain/repositories/customer.repository';

function sampleCustomer(overrides: Partial<Parameters<typeof CustomerEntity.create>[0]> = {}): CustomerEntity {
  return CustomerEntity.create({
    id: 'customer-1',
    userId: 'user-1',
    firstName: 'Nirina',
    lastName: 'Rakoto',
    phone: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  });
}

describe('UpdateCustomerProfileUseCase', () => {
  it('updates the profile resolved from the userId', async () => {
    const customerRepository: ICustomerRepository = {
      findByUserId: jest.fn().mockResolvedValue(sampleCustomer()),
      findById: jest.fn(),
      update: jest.fn().mockResolvedValue(sampleCustomer({ firstName: 'Nirina Updated' })),
    };
    const useCase = new UpdateCustomerProfileUseCase(customerRepository);

    const result = await useCase.execute('user-1', { firstName: 'Nirina Updated' });

    expect(customerRepository.update).toHaveBeenCalledWith('customer-1', { firstName: 'Nirina Updated' });
    expect(result.firstName).toBe('Nirina Updated');
  });

  it('throws NotFoundException when no profile exists for the userId', async () => {
    const customerRepository: ICustomerRepository = {
      findByUserId: jest.fn().mockResolvedValue(null),
      findById: jest.fn(),
      update: jest.fn(),
    };
    const useCase = new UpdateCustomerProfileUseCase(customerRepository);

    await expect(useCase.execute('unknown-user', { firstName: 'X' })).rejects.toThrow(NotFoundException);
    expect(customerRepository.update).not.toHaveBeenCalled();
  });
});
