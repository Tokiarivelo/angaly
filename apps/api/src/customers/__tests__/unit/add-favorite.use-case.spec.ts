import { NotFoundException } from '@nestjs/common';

import { CustomerEntity } from '../../domain/entities/customer.entity';
import { FavoriteEntity } from '../../domain/entities/favorite.entity';
import { AddFavoriteUseCase } from '../../application/use-cases/add-favorite.use-case';
import type { ICustomerRepository } from '../../domain/repositories/customer.repository';
import type { IFavoriteRepository } from '../../domain/repositories/favorite.repository';

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

function sampleFavorite(): FavoriteEntity {
  return FavoriteEntity.create({
    id: 'favorite-1',
    customerId: 'customer-1',
    entityType: 'CREATION',
    entityId: 'creation-1',
    createdAt: new Date(),
  });
}

describe('AddFavoriteUseCase', () => {
  it('creates a new favorite when none exists yet', async () => {
    const customerRepository: ICustomerRepository = {
      findByUserId: jest.fn().mockResolvedValue(sampleCustomer()),
      findById: jest.fn(),
      update: jest.fn(),
    };
    const favoriteRepository: IFavoriteRepository = {
      findById: jest.fn(),
      findByCustomerAndEntity: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockResolvedValue(sampleFavorite()),
      delete: jest.fn(),
      listByCustomer: jest.fn(),
    };
    const useCase = new AddFavoriteUseCase(customerRepository, favoriteRepository);

    const result = await useCase.execute('user-1', 'CREATION', 'creation-1');

    expect(favoriteRepository.create).toHaveBeenCalledWith('customer-1', 'CREATION', 'creation-1');
    expect(result.id).toBe('favorite-1');
  });

  it('is idempotent: returns the existing favorite instead of creating a duplicate', async () => {
    const customerRepository: ICustomerRepository = {
      findByUserId: jest.fn().mockResolvedValue(sampleCustomer()),
      findById: jest.fn(),
      update: jest.fn(),
    };
    const favoriteRepository: IFavoriteRepository = {
      findById: jest.fn(),
      findByCustomerAndEntity: jest.fn().mockResolvedValue(sampleFavorite()),
      create: jest.fn(),
      delete: jest.fn(),
      listByCustomer: jest.fn(),
    };
    const useCase = new AddFavoriteUseCase(customerRepository, favoriteRepository);

    const result = await useCase.execute('user-1', 'CREATION', 'creation-1');

    expect(favoriteRepository.create).not.toHaveBeenCalled();
    expect(result.id).toBe('favorite-1');
  });

  it('throws NotFoundException when no customer profile exists for the userId', async () => {
    const customerRepository: ICustomerRepository = {
      findByUserId: jest.fn().mockResolvedValue(null),
      findById: jest.fn(),
      update: jest.fn(),
    };
    const favoriteRepository: IFavoriteRepository = {
      findById: jest.fn(),
      findByCustomerAndEntity: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
      listByCustomer: jest.fn(),
    };
    const useCase = new AddFavoriteUseCase(customerRepository, favoriteRepository);

    await expect(useCase.execute('unknown-user', 'CREATION', 'creation-1')).rejects.toThrow(NotFoundException);
  });
});
