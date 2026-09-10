import { NotFoundException } from '@nestjs/common';

import { CustomerEntity } from '../../domain/entities/customer.entity';
import { GetCustomerProfileUseCase } from '../../application/use-cases/get-customer-profile.use-case';
import type { ICustomerRepository } from '../../domain/repositories/customer.repository';

function sampleCustomer(): CustomerEntity {
  return CustomerEntity.create({
    id: 'customer-1',
    userId: 'user-1',
    firstName: 'Nirina',
    lastName: 'Rakoto',
    phone: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

describe('GetCustomerProfileUseCase', () => {
  it('returns the customer profile for the given userId', async () => {
    const customerRepository: ICustomerRepository = {
      findByUserId: jest.fn().mockResolvedValue(sampleCustomer()),
      findById: jest.fn(),
      update: jest.fn(),
    };
    const useCase = new GetCustomerProfileUseCase(customerRepository);

    const result = await useCase.execute('user-1');

    expect(result.id).toBe('customer-1');
    expect(customerRepository.findByUserId).toHaveBeenCalledWith('user-1');
  });

  it('throws NotFoundException when no profile exists for the userId', async () => {
    const customerRepository: ICustomerRepository = {
      findByUserId: jest.fn().mockResolvedValue(null),
      findById: jest.fn(),
      update: jest.fn(),
    };
    const useCase = new GetCustomerProfileUseCase(customerRepository);

    await expect(useCase.execute('unknown-user')).rejects.toThrow(NotFoundException);
  });
});
