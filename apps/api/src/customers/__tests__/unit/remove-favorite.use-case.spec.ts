import { ForbiddenException, NotFoundException } from '@nestjs/common';

import { CustomerEntity } from '../../domain/entities/customer.entity';
import { FavoriteEntity } from '../../domain/entities/favorite.entity';
import { RemoveFavoriteUseCase } from '../../application/use-cases/remove-favorite.use-case';
import type { ICustomerRepository } from '../../domain/repositories/customer.repository';
import type { IFavoriteRepository } from '../../domain/repositories/favorite.repository';

function sampleCustomer(id = 'customer-1'): CustomerEntity {
  return CustomerEntity.create({
    id,
    userId: 'user-1',
    firstName: 'Nirina',
    lastName: 'Rakoto',
    phone: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

function sampleFavorite(customerId = 'customer-1'): FavoriteEntity {
  return FavoriteEntity.create({
    id: 'favorite-1',
    customerId,
    entityType: 'CREATION',
    entityId: 'creation-1',
    createdAt: new Date(),
  });
}

describe('RemoveFavoriteUseCase', () => {
  it('deletes the favorite when it belongs to the requesting customer', async () => {
    const customerRepository: ICustomerRepository = {
      findByUserId: jest.fn().mockResolvedValue(sampleCustomer()),
      findById: jest.fn(),
      update: jest.fn(),
    };
    const favoriteRepository: IFavoriteRepository = {
      findById: jest.fn().mockResolvedValue(sampleFavorite()),
      findByCustomerAndEntity: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
      listByCustomer: jest.fn(),
    };
    const useCase = new RemoveFavoriteUseCase(customerRepository, favoriteRepository);

    await useCase.execute('user-1', 'favorite-1');

    expect(favoriteRepository.delete).toHaveBeenCalledWith('favorite-1');
  });

  it('throws ForbiddenException when the favorite belongs to a different customer', async () => {
    const customerRepository: ICustomerRepository = {
      findByUserId: jest.fn().mockResolvedValue(sampleCustomer('customer-1')),
      findById: jest.fn(),
      update: jest.fn(),
    };
    const favoriteRepository: IFavoriteRepository = {
      findById: jest.fn().mockResolvedValue(sampleFavorite('someone-elses-customer')),
      findByCustomerAndEntity: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
      listByCustomer: jest.fn(),
    };
    const useCase = new RemoveFavoriteUseCase(customerRepository, favoriteRepository);

    await expect(useCase.execute('user-1', 'favorite-1')).rejects.toThrow(ForbiddenException);
    expect(favoriteRepository.delete).not.toHaveBeenCalled();
  });

  it('throws NotFoundException when the favorite does not exist', async () => {
    const customerRepository: ICustomerRepository = {
      findByUserId: jest.fn().mockResolvedValue(sampleCustomer()),
      findById: jest.fn(),
      update: jest.fn(),
    };
    const favoriteRepository: IFavoriteRepository = {
      findById: jest.fn().mockResolvedValue(null),
      findByCustomerAndEntity: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
      listByCustomer: jest.fn(),
    };
    const useCase = new RemoveFavoriteUseCase(customerRepository, favoriteRepository);

    await expect(useCase.execute('user-1', 'missing-id')).rejects.toThrow(NotFoundException);
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
    const useCase = new RemoveFavoriteUseCase(customerRepository, favoriteRepository);

    await expect(useCase.execute('unknown-user', 'favorite-1')).rejects.toThrow(NotFoundException);
  });
});
