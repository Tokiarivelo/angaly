import { ListStaffUsersUseCase } from '../../application/use-cases/list-staff-users.use-case';
import { StaffUserEntity } from '../../domain/entities/staff-user.entity';
import type { IStaffUserRepository } from '../../domain/repositories/staff-user.repository';

describe('ListStaffUsersUseCase', () => {
  it('delegates to the repository with the given filter', async () => {
    const entity = StaffUserEntity.create({
      id: 'user-1',
      email: 'a@angaly.com',
      role: 'ADMIN',
      isActive: true,
      lastLoginAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    const repository: jest.Mocked<IStaffUserRepository> = {
      list: jest.fn().mockResolvedValue({ items: [entity], total: 1 }),
      findById: jest.fn(),
      findByEmail: jest.fn(),
      create: jest.fn(),
      updateRole: jest.fn(),
      setActive: jest.fn(),
    };

    const useCase = new ListStaffUsersUseCase(repository);
    const result = await useCase.execute({ page: 1, limit: 20 });

    expect(repository.list).toHaveBeenCalledWith({ page: 1, limit: 20 });
    expect(result.items).toEqual([entity]);
    expect(result.total).toBe(1);
  });
});
