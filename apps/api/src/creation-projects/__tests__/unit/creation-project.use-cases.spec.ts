import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { CreationProjectStage } from '@angaly/types';

import { CustomerEntity } from '../../../customers/domain/entities/customer.entity';
import type { ICustomerRepository } from '../../../customers/domain/repositories/customer.repository';
import { GetCreationProjectUseCase } from '../../application/use-cases/get-creation-project.use-case';
import { ListCreationProjectsUseCase } from '../../application/use-cases/list-creation-projects.use-case';
import { CreationProjectEntity } from '../../domain/entities/creation-project.entity';
import type { ICreationProjectRepository } from '../../domain/repositories/creation-project.repository';

const customer = CustomerEntity.create({
  id: 'c-1',
  userId: 'u-1',
  firstName: 'Nirina',
  lastName: 'Rakoto',
  phone: null,
  createdAt: new Date(),
  updatedAt: new Date(),
});

function project(customerId: string): CreationProjectEntity {
  return CreationProjectEntity.create({
    id: 'p-1',
    reference: 'CRP-2026-0001',
    customerId,
    title: 'Robe mariage 2026',
    description: null,
    stage: CreationProjectStage.CONSULTATION,
    quoteId: null,
    creationId: null,
    completedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

describe('creation-projects use cases', () => {
  const customers = { findByUserId: jest.fn(), findById: jest.fn(), update: jest.fn() } as jest.Mocked<ICustomerRepository>;
  const repository: jest.Mocked<ICreationProjectRepository> = {
    findByCustomerId: jest.fn(),
    findById: jest.fn(),
    findByQuoteId: jest.fn(),
    findAll: jest.fn(),
    create: jest.fn(),
    updateStage: jest.fn(),
  };

  beforeEach(() => {
    jest.resetAllMocks();
    customers.findByUserId.mockResolvedValue(customer);
  });

  it('lists the projects of the caller’s customer', async () => {
    repository.findByCustomerId.mockResolvedValue([project('c-1')]);
    const result = await new ListCreationProjectsUseCase(customers, repository).execute('u-1');
    // eslint-disable-next-line @typescript-eslint/unbound-method -- jest mock assertion
    expect(repository.findByCustomerId).toHaveBeenCalledWith('c-1');
    expect(result).toHaveLength(1);
  });

  it('returns an owned project', async () => {
    repository.findById.mockResolvedValue(project('c-1'));
    const result = await new GetCreationProjectUseCase(customers, repository).execute('u-1', 'p-1');
    expect(result.id).toBe('p-1');
  });

  it('throws NotFound for an unknown project', async () => {
    repository.findById.mockResolvedValue(null);
    await expect(new GetCreationProjectUseCase(customers, repository).execute('u-1', 'x')).rejects.toThrow(NotFoundException);
  });

  it('throws Forbidden for another customer’s project', async () => {
    repository.findById.mockResolvedValue(project('c-2'));
    await expect(new GetCreationProjectUseCase(customers, repository).execute('u-1', 'p-1')).rejects.toThrow(ForbiddenException);
  });
});
