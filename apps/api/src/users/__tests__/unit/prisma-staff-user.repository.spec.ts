import type { PrismaService } from '../../../prisma/prisma.service';
import { PrismaStaffUserRepository } from '../../infrastructure/repositories/prisma-staff-user.repository';

interface MockUserDelegate {
  findMany: jest.Mock;
  findFirst: jest.Mock;
  count: jest.Mock;
  create: jest.Mock;
  update: jest.Mock;
}

function buildPrismaServiceMock(): { prisma: PrismaService; user: MockUserDelegate } {
  const user: MockUserDelegate = {
    findMany: jest.fn(),
    findFirst: jest.fn(),
    count: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  };
  const prisma = { user } as unknown as PrismaService;
  return { prisma, user };
}

function sampleRecord(overrides: Record<string, unknown> = {}) {
  return {
    id: 'user-1',
    email: 'manager@angaly.com',
    passwordHash: 'hashed',
    role: 'MANAGER',
    isActive: true,
    lastLoginAt: null,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    ...overrides,
  };
}

describe('PrismaStaffUserRepository', () => {
  it('list() scopes the query to role != CLIENT and applies the given filters', async () => {
    const { prisma, user } = buildPrismaServiceMock();
    user.findMany.mockResolvedValue([sampleRecord()]);
    user.count.mockResolvedValue(1);
    const repository = new PrismaStaffUserRepository(prisma);

    const result = await repository.list({ role: 'MANAGER', isActive: true, page: 1, limit: 20 });

    expect(user.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { role: 'MANAGER', isActive: true },
        skip: 0,
        take: 20,
      }),
    );
    expect(result.total).toBe(1);
    expect(result.items).toHaveLength(1);
  });

  it('list() defaults to excluding CLIENT rows when no role filter is given', async () => {
    const { prisma, user } = buildPrismaServiceMock();
    user.findMany.mockResolvedValue([]);
    user.count.mockResolvedValue(0);
    const repository = new PrismaStaffUserRepository(prisma);

    await repository.list({ page: 1, limit: 20 });

    expect(user.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { role: { not: 'CLIENT' } } }),
    );
  });

  it('findById() returns null when not found among staff rows', async () => {
    const { prisma, user } = buildPrismaServiceMock();
    user.findFirst.mockResolvedValue(null);
    const repository = new PrismaStaffUserRepository(prisma);

    expect(await repository.findById('missing')).toBeNull();
  });

  it('findByEmail() maps the row when found', async () => {
    const { prisma, user } = buildPrismaServiceMock();
    user.findFirst.mockResolvedValue(sampleRecord());
    const repository = new PrismaStaffUserRepository(prisma);

    const result = await repository.findByEmail('manager@angaly.com');

    expect(result?.email).toBe('manager@angaly.com');
  });

  it('create() persists the staff user', async () => {
    const { prisma, user } = buildPrismaServiceMock();
    user.create.mockResolvedValue(sampleRecord());
    const repository = new PrismaStaffUserRepository(prisma);

    const result = await repository.create({
      email: 'manager@angaly.com',
      passwordHash: 'hashed',
      role: 'MANAGER',
    });

    expect(user.create).toHaveBeenCalledWith({
      data: { email: 'manager@angaly.com', passwordHash: 'hashed', role: 'MANAGER' },
    });
    expect(result.id).toBe('user-1');
  });

  it('updateRole() forwards to prisma.user.update', async () => {
    const { prisma, user } = buildPrismaServiceMock();
    user.update.mockResolvedValue(sampleRecord({ role: 'ADMIN' }));
    const repository = new PrismaStaffUserRepository(prisma);

    const result = await repository.updateRole('user-1', 'ADMIN');

    expect(user.update).toHaveBeenCalledWith({ where: { id: 'user-1' }, data: { role: 'ADMIN' } });
    expect(result.role).toBe('ADMIN');
  });

  it('setActive() forwards to prisma.user.update', async () => {
    const { prisma, user } = buildPrismaServiceMock();
    user.update.mockResolvedValue(sampleRecord({ isActive: false }));
    const repository = new PrismaStaffUserRepository(prisma);

    const result = await repository.setActive('user-1', false);

    expect(user.update).toHaveBeenCalledWith({ where: { id: 'user-1' }, data: { isActive: false } });
    expect(result.isActive).toBe(false);
  });
});
