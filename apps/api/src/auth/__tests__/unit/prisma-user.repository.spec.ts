import type { UserRecord } from '../../infrastructure/repositories/prisma-user.repository';
import { PrismaUserRepository } from '../../infrastructure/repositories/prisma-user.repository';
import type { PrismaService } from '../../../prisma/prisma.service';

interface MockUserDelegate {
  findUnique: jest.Mock;
  create: jest.Mock;
  update: jest.Mock;
}
interface MockCustomerDelegate {
  create: jest.Mock;
}

function sampleRecord(): UserRecord {
  return {
    id: 'user-1',
    email: 'client@example.com',
    passwordHash: 'hashed',
    role: 'CLIENT',
    isActive: true,
    lastLoginAt: null,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  };
}

function buildPrismaServiceMock() {
  const user: MockUserDelegate = { findUnique: jest.fn(), create: jest.fn(), update: jest.fn() };
  const customer: MockCustomerDelegate = { create: jest.fn() };
  const $transaction = jest.fn((fn: (tx: { user: MockUserDelegate; customer: MockCustomerDelegate }) => unknown) =>
    Promise.resolve(fn({ user, customer })),
  );
  const prisma = { user, customer, $transaction } as unknown as PrismaService;
  return { prisma, user, customer, $transaction };
}

describe('PrismaUserRepository', () => {
  it('findByEmail() returns null when no row matches', async () => {
    const { prisma, user } = buildPrismaServiceMock();
    user.findUnique.mockResolvedValue(null);

    expect(await new PrismaUserRepository(prisma).findByEmail('missing@example.com')).toBeNull();
  });

  it('findByEmail() maps a found row to a domain entity', async () => {
    const { prisma, user } = buildPrismaServiceMock();
    user.findUnique.mockResolvedValue(sampleRecord());

    const result = await new PrismaUserRepository(prisma).findByEmail('client@example.com');
    expect(result?.email).toBe('client@example.com');
  });

  it('findById() maps a found row to a domain entity', async () => {
    const { prisma, user } = buildPrismaServiceMock();
    user.findUnique.mockResolvedValue(sampleRecord());

    const result = await new PrismaUserRepository(prisma).findById('user-1');
    expect(result?.id).toBe('user-1');
  });

  it('createWithCustomer() creates both rows inside a single transaction', async () => {
    const { prisma, user, customer, $transaction } = buildPrismaServiceMock();
    user.create.mockResolvedValue(sampleRecord());

    const result = await new PrismaUserRepository(prisma).createWithCustomer(
      { email: 'client@example.com', passwordHash: 'hashed', role: 'CLIENT' },
      { firstName: 'Jean', lastName: 'Rakoto', phone: null },
    );

    expect($transaction).toHaveBeenCalledTimes(1);
    expect(user.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: { email: 'client@example.com', passwordHash: 'hashed', role: 'CLIENT' } }),
    );
    expect(customer.create).toHaveBeenCalledWith({
      data: { userId: 'user-1', firstName: 'Jean', lastName: 'Rakoto', phone: null },
    });
    expect(result.id).toBe('user-1');
  });

  it('updateLastLoginAt() updates the row', async () => {
    const { prisma, user } = buildPrismaServiceMock();
    const at = new Date('2026-01-05T00:00:00.000Z');

    await new PrismaUserRepository(prisma).updateLastLoginAt('user-1', at);

    expect(user.update).toHaveBeenCalledWith({ where: { id: 'user-1' }, data: { lastLoginAt: at } });
  });

  it('updatePasswordHash() updates the row', async () => {
    const { prisma, user } = buildPrismaServiceMock();

    await new PrismaUserRepository(prisma).updatePasswordHash('user-1', 'new-hash');

    expect(user.update).toHaveBeenCalledWith({ where: { id: 'user-1' }, data: { passwordHash: 'new-hash' } });
  });
});
