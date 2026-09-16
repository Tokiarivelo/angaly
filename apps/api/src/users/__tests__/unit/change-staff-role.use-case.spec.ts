import { BadRequestException, NotFoundException } from '@nestjs/common';

import { ChangeStaffRoleUseCase } from '../../application/use-cases/change-staff-role.use-case';
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

describe('ChangeStaffRoleUseCase', () => {
  it('updates the role of another staff member', async () => {
    const target = buildEntity();
    const updated = buildEntity({ role: 'MANAGER' });
    const repository = buildRepository({
      findById: jest.fn().mockResolvedValue(target),
      updateRole: jest.fn().mockResolvedValue(updated),
    });

    const useCase = new ChangeStaffRoleUseCase(repository);
    const result = await useCase.execute({ targetUserId: 'user-2', role: 'MANAGER', actorUserId: 'admin-1' });

    expect(repository.updateRole).toHaveBeenCalledWith('user-2', 'MANAGER');
    expect(result).toBe(updated);
  });

  it('rejects an admin trying to change their own role', async () => {
    const repository = buildRepository();
    const useCase = new ChangeStaffRoleUseCase(repository);

    await expect(
      useCase.execute({ targetUserId: 'admin-1', role: 'MANAGER', actorUserId: 'admin-1' }),
    ).rejects.toThrow(BadRequestException);
    expect(repository.findById).not.toHaveBeenCalled();
  });

  it('throws NotFoundException when the target does not exist', async () => {
    const repository = buildRepository({ findById: jest.fn().mockResolvedValue(null) });
    const useCase = new ChangeStaffRoleUseCase(repository);

    await expect(
      useCase.execute({ targetUserId: 'missing', role: 'MANAGER', actorUserId: 'admin-1' }),
    ).rejects.toThrow(NotFoundException);
  });
});
