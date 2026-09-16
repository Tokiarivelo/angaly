import { BadRequestException, NotFoundException } from '@nestjs/common';

import { SetStaffUserStatusUseCase } from '../../application/use-cases/set-staff-user-status.use-case';
import { StaffUserEntity } from '../../domain/entities/staff-user.entity';
import type { IStaffUserRepository } from '../../domain/repositories/staff-user.repository';

function buildRepository(overrides: Partial<jest.Mocked<IStaffUserRepository>> = {}): jest.Mocked<IStaffUserRepository> {
  return {
    list: jest.fn(),
    findById: jest.fn(),
    findByEmail: jest.fn(),
    create: jest.fn(),
    updateRole: jest.fn(),
    setActive: jest.fn(),
    ...overrides,
  };
}

function buildEntity(overrides: Partial<Parameters<typeof StaffUserEntity.create>[0]> = {}) {
  return StaffUserEntity.create({
    id: 'user-2',
    email: 'target@angaly.com',
    role: 'COUTURIERE',
    isActive: true,
    lastLoginAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  });
}

describe('SetStaffUserStatusUseCase', () => {
  it('deactivates another staff member', async () => {
    const target = buildEntity();
    const updated = buildEntity({ isActive: false });
    const repository = buildRepository({
      findById: jest.fn().mockResolvedValue(target),
      setActive: jest.fn().mockResolvedValue(updated),
    });

    const useCase = new SetStaffUserStatusUseCase(repository);
    const result = await useCase.execute({ targetUserId: 'user-2', isActive: false, actorUserId: 'admin-1' });

    expect(repository.setActive).toHaveBeenCalledWith('user-2', false);
    expect(result).toBe(updated);
  });

  it('rejects an admin trying to deactivate their own account', async () => {
    const repository = buildRepository();
    const useCase = new SetStaffUserStatusUseCase(repository);

    await expect(
      useCase.execute({ targetUserId: 'admin-1', isActive: false, actorUserId: 'admin-1' }),
    ).rejects.toThrow(BadRequestException);
    expect(repository.findById).not.toHaveBeenCalled();
  });

  it('allows an admin to reactivate their own account', async () => {
    const target = buildEntity({ id: 'admin-1', isActive: false });
    const updated = buildEntity({ id: 'admin-1', isActive: true });
    const repository = buildRepository({
      findById: jest.fn().mockResolvedValue(target),
      setActive: jest.fn().mockResolvedValue(updated),
    });
    const useCase = new SetStaffUserStatusUseCase(repository);

    const result = await useCase.execute({ targetUserId: 'admin-1', isActive: true, actorUserId: 'admin-1' });

    expect(result).toBe(updated);
  });

  it('throws NotFoundException when the target does not exist', async () => {
    const repository = buildRepository({ findById: jest.fn().mockResolvedValue(null) });
    const useCase = new SetStaffUserStatusUseCase(repository);

    await expect(
      useCase.execute({ targetUserId: 'missing', isActive: false, actorUserId: 'admin-1' }),
    ).rejects.toThrow(NotFoundException);
  });
});
