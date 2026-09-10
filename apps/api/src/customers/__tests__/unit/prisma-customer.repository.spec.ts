import type { CustomerRecord } from '../../infrastructure/repositories/prisma-customer.repository';
import { PrismaCustomerRepository } from '../../infrastructure/repositories/prisma-customer.repository';
import type { PrismaService } from '../../../prisma/prisma.service';

interface MockCustomerDelegate {
  findUnique: jest.Mock;
  update: jest.Mock;
}

function buildPrismaServiceMock(): { prisma: PrismaService; customer: MockCustomerDelegate } {
  const customer: MockCustomerDelegate = { findUnique: jest.fn(), update: jest.fn() };
  const prisma = { customer } as unknown as PrismaService;
  return { prisma, customer };
}

function sampleRecord(): CustomerRecord {
  return {
    id: 'customer-1',
    userId: 'user-1',
    firstName: 'Nirina',
    lastName: 'Rakoto',
    phone: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

describe('PrismaCustomerRepository', () => {
  it('findByUserId() returns null when no row matches', async () => {
    const { prisma, customer } = buildPrismaServiceMock();
    customer.findUnique.mockResolvedValue(null);
    const repository = new PrismaCustomerRepository(prisma);

    expect(await repository.findByUserId('unknown-user')).toBeNull();
  });

  it('findByUserId() maps the row to a domain entity when found', async () => {
    const { prisma, customer } = buildPrismaServiceMock();
    customer.findUnique.mockResolvedValue(sampleRecord());
    const repository = new PrismaCustomerRepository(prisma);

    const result = await repository.findByUserId('user-1');

    expect(result?.id).toBe('customer-1');
    expect(customer.findUnique).toHaveBeenCalledWith(expect.objectContaining({ where: { userId: 'user-1' } }));
  });

  it('findById() maps the row to a domain entity when found', async () => {
    const { prisma, customer } = buildPrismaServiceMock();
    customer.findUnique.mockResolvedValue(sampleRecord());
    const repository = new PrismaCustomerRepository(prisma);

    const result = await repository.findById('customer-1');

    expect(result?.id).toBe('customer-1');
  });

  it('update() persists the given changes and returns the mapped entity', async () => {
    const { prisma, customer } = buildPrismaServiceMock();
    customer.update.mockResolvedValue({ ...sampleRecord(), firstName: 'Updated' });
    const repository = new PrismaCustomerRepository(prisma);

    const result = await repository.update('customer-1', { firstName: 'Updated' });

    expect(customer.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'customer-1' }, data: { firstName: 'Updated' } }),
    );
    expect(result.firstName).toBe('Updated');
  });
});
