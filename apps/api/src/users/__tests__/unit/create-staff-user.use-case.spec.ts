import { ConflictException } from '@nestjs/common';

import type { IPasswordHasher } from '../../../auth/domain/services/password-hasher';
import { CreateStaffUserUseCase } from '../../application/use-cases/create-staff-user.use-case';
import { StaffUserEntity } from '../../domain/entities/staff-user.entity';
import type { IStaffUserRepository } from '../../domain/repositories/staff-user.repository';

function buildRepository(overrides: Partial<jest.Mocked<IStaffUserRepository>> = {}): jest.Mocked<IStaffUserRepository> {
  return {
    list: jest.fn(),
    findById: jest.fn(),
    findByEmail: jest.fn().mockResolvedValue(null),
    create: jest.fn(),
    updateRole: jest.fn(),
    setActive: jest.fn(),
    ...overrides,
  };
}

describe('CreateStaffUserUseCase', () => {
  it('hashes the password via the shared IPasswordHasher port and creates the account', async () => {
    const created = StaffUserEntity.create({
      id: 'user-1',
      email: 'couturiere@angaly.com',
      role: 'COUTURIERE',
      isActive: true,
      lastLoginAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    const repository = buildRepository({ create: jest.fn().mockResolvedValue(created) });
    const passwordHasher: jest.Mocked<IPasswordHasher> = {
      hash: jest.fn().mockResolvedValue('hashed-password'),
      compare: jest.fn(),
    };

    const useCase = new CreateStaffUserUseCase(repository, passwordHasher);
    const result = await useCase.execute({
      email: 'Couturiere@Angaly.com',
      password: 'super-secret',
      role: 'COUTURIERE',
    });

    expect(passwordHasher.hash).toHaveBeenCalledWith('super-secret');
    expect(repository.create).toHaveBeenCalledWith({
      email: 'couturiere@angaly.com',
      passwordHash: 'hashed-password',
      role: 'COUTURIERE',
    });
    expect(result).toBe(created);
  });

  it('throws ConflictException when the email is already used by a staff account', async () => {
    const existing = StaffUserEntity.create({
      id: 'user-1',
      email: 'admin@angaly.com',
      role: 'ADMIN',
      isActive: true,
      lastLoginAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    const repository = buildRepository({ findByEmail: jest.fn().mockResolvedValue(existing) });
    const passwordHasher: jest.Mocked<IPasswordHasher> = { hash: jest.fn(), compare: jest.fn() };

    const useCase = new CreateStaffUserUseCase(repository, passwordHasher);

    await expect(
      useCase.execute({ email: 'admin@angaly.com', password: 'super-secret', role: 'ADMIN' }),
    ).rejects.toThrow(ConflictException);
    expect(passwordHasher.hash).not.toHaveBeenCalled();
  });
});
