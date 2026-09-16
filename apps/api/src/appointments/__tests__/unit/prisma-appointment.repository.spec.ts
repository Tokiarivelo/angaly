import { PrismaAppointmentRepository } from '../../infrastructure/repositories/prisma-appointment.repository';
import type { AppointmentRecord } from '../../infrastructure/repositories/prisma-appointment.repository';
import type { CreateAppointmentInput } from '../../domain/repositories/appointment.repository';
import type { PrismaService } from '../../../prisma/prisma.service';

interface MockAppointmentDelegate {
  findUnique: jest.Mock;
  create: jest.Mock;
  update: jest.Mock;
  findMany: jest.Mock;
}

function buildPrismaServiceMock(): { prisma: PrismaService; appointment: MockAppointmentDelegate } {
  const appointment: MockAppointmentDelegate = {
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    findMany: jest.fn(),
  };
  const prisma = { appointment } as unknown as PrismaService;
  return { prisma, appointment };
}

function sampleRecord(overrides: Partial<AppointmentRecord> = {}): AppointmentRecord {
  return {
    id: 'appointment-1',
    reference: 'ANG-RDV-2026-AbCdEfGh',
    customerId: null,
    firstName: 'Nirina',
    lastName: 'Rakoto',
    phone: '+261 34 12 345 67',
    email: 'nirina@example.com',
    type: 'ESSAYAGE',
    atelierId: 'atelier-1',
    assignedToId: null,
    scheduledAt: new Date('2026-09-15T09:00:00.000Z'),
    durationMinutes: 45,
    status: 'PENDING',
    message: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

function sampleInput(): CreateAppointmentInput {
  return {
    reference: 'ANG-RDV-2026-AbCdEfGh',
    customerId: null,
    firstName: 'Nirina',
    lastName: 'Rakoto',
    phone: '+261 34 12 345 67',
    email: 'nirina@example.com',
    type: 'ESSAYAGE',
    atelierId: 'atelier-1',
    scheduledAt: new Date('2026-09-15T09:00:00.000Z'),
    durationMinutes: 45,
    message: null,
  };
}

describe('PrismaAppointmentRepository', () => {
  it('findByReference() returns null when no row matches', async () => {
    const { prisma, appointment } = buildPrismaServiceMock();
    appointment.findUnique.mockResolvedValue(null);
    const repository = new PrismaAppointmentRepository(prisma);

    expect(await repository.findByReference('missing')).toBeNull();
  });

  it('findByReference() maps the row to a domain entity when found', async () => {
    const { prisma, appointment } = buildPrismaServiceMock();
    appointment.findUnique.mockResolvedValue(sampleRecord());
    const repository = new PrismaAppointmentRepository(prisma);

    const result = await repository.findByReference('ANG-RDV-2026-AbCdEfGh');

    expect(result?.id).toBe('appointment-1');
  });

  it('create() persists the given input', async () => {
    const { prisma, appointment } = buildPrismaServiceMock();
    appointment.create.mockResolvedValue(sampleRecord());
    const repository = new PrismaAppointmentRepository(prisma);

    const result = await repository.create(sampleInput());

    const call = appointment.create.mock.calls[0] as [{ data: { reference: string } }];
    expect(call[0].data.reference).toBe('ANG-RDV-2026-AbCdEfGh');
    expect(result.id).toBe('appointment-1');
  });

  it('updateStatus() updates only the status when no assignedToId is given', async () => {
    const { prisma, appointment } = buildPrismaServiceMock();
    appointment.update.mockResolvedValue(sampleRecord({ status: 'CANCELLED' }));
    const repository = new PrismaAppointmentRepository(prisma);

    await repository.updateStatus('appointment-1', 'CANCELLED');

    expect(appointment.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'appointment-1' }, data: { status: 'CANCELLED' } }),
    );
  });

  it('updateStatus() also sets assignedToId when given', async () => {
    const { prisma, appointment } = buildPrismaServiceMock();
    appointment.update.mockResolvedValue(sampleRecord({ status: 'CONFIRMED', assignedToId: 'staff-1' }));
    const repository = new PrismaAppointmentRepository(prisma);

    await repository.updateStatus('appointment-1', 'CONFIRMED', 'staff-1');

    expect(appointment.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { status: 'CONFIRMED', assignedToId: 'staff-1' } }),
    );
  });

  it('findByCustomerId() filters by customerId, most recent first', async () => {
    const { prisma, appointment } = buildPrismaServiceMock();
    appointment.findMany.mockResolvedValue([sampleRecord()]);
    const repository = new PrismaAppointmentRepository(prisma);

    const result = await repository.findByCustomerId('customer-1');

    expect(appointment.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { customerId: 'customer-1' }, orderBy: { scheduledAt: 'desc' } }),
    );
    expect(result).toHaveLength(1);
  });

  it('findAll() returns every appointment, most recent first', async () => {
    const { prisma, appointment } = buildPrismaServiceMock();
    appointment.findMany.mockResolvedValue([sampleRecord(), sampleRecord({ id: 'appointment-2' })]);
    const repository = new PrismaAppointmentRepository(prisma);

    const result = await repository.findAll();

    expect(appointment.findMany).toHaveBeenCalledWith(expect.objectContaining({ orderBy: { scheduledAt: 'desc' } }));
    expect(result).toHaveLength(2);
  });

  it('listActiveByAtelierAndRange() filters by atelier, active statuses, and date range', async () => {
    const { prisma, appointment } = buildPrismaServiceMock();
    appointment.findMany.mockResolvedValue([sampleRecord()]);
    const repository = new PrismaAppointmentRepository(prisma);

    const rangeStart = new Date('2026-09-01T00:00:00.000Z');
    const rangeEnd = new Date('2026-09-30T00:00:00.000Z');
    const result = await repository.listActiveByAtelierAndRange('atelier-1', rangeStart, rangeEnd);

    expect(appointment.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          atelierId: 'atelier-1',
          status: { in: ['PENDING', 'CONFIRMED'] },
          scheduledAt: { gte: rangeStart, lt: rangeEnd },
        },
      }),
    );
    expect(result).toHaveLength(1);
  });
});
