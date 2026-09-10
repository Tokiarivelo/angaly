import { ConflictException, NotFoundException } from '@nestjs/common';

import { AtelierEntity } from '../../../ateliers/domain/entities/atelier.entity';
import type { IAtelierRepository } from '../../../ateliers/domain/repositories/atelier.repository';
import { CustomerEntity } from '../../../customers/domain/entities/customer.entity';
import type { ICustomerRepository } from '../../../customers/domain/repositories/customer.repository';
import { AppointmentEntity } from '../../domain/entities/appointment.entity';
import type { IAppointmentRepository } from '../../domain/repositories/appointment.repository';
import { CreateAppointmentUseCase } from '../../application/use-cases/create-appointment.use-case';

function sampleAtelier(): AtelierEntity {
  return AtelierEntity.create({
    id: 'atelier-1',
    slug: 'antananarivo-centre',
    name: 'Atelier Antananarivo Centre',
    address: '12 Rue de la Paix',
    city: 'Antananarivo',
    phone: null,
    openingHours: {
      monday: { isOpen: false, slots: [] },
      tuesday: { isOpen: true, slots: [{ open: '09:00', close: '10:30' }] },
      wednesday: { isOpen: false, slots: [] },
      thursday: { isOpen: false, slots: [] },
      friday: { isOpen: false, slots: [] },
      saturday: { isOpen: false, slots: [] },
      sunday: { isOpen: false, slots: [] },
    },
    services: [],
    latitude: null,
    longitude: null,
    media: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

function sampleCustomer(): CustomerEntity {
  return CustomerEntity.create({
    id: 'customer-1',
    userId: 'user-1',
    firstName: 'Nirina',
    lastName: 'Rakoto',
    phone: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

function sampleAppointment(scheduledAt: Date): AppointmentEntity {
  return AppointmentEntity.create({
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
    scheduledAt,
    durationMinutes: 45,
    status: 'PENDING',
    message: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

function buildUseCase(overrides: {
  atelier?: AtelierEntity | null;
  customer?: CustomerEntity | null;
  conflicting?: AppointmentEntity[];
}) {
  const atelierRepository: IAtelierRepository = {
    findBySlug: jest.fn(),
    findById: jest.fn().mockResolvedValue(overrides.atelier !== undefined ? overrides.atelier : sampleAtelier()),
    list: jest.fn(),
  };
  const customerRepository: ICustomerRepository = {
    findByUserId: jest.fn().mockResolvedValue(overrides.customer ?? null),
    findById: jest.fn(),
    update: jest.fn(),
  };
  const appointmentRepository: jest.Mocked<IAppointmentRepository> = {
    findByReference: jest.fn(),
    create: jest.fn().mockResolvedValue(sampleAppointment(new Date('2026-09-01T09:00:00.000Z'))),
    updateStatus: jest.fn(),
    listActiveByAtelierAndRange: jest.fn().mockResolvedValue(overrides.conflicting ?? []),
  };

  return { useCase: new CreateAppointmentUseCase(atelierRepository, customerRepository, appointmentRepository), appointmentRepository };
}

const BASE_COMMAND = {
  userId: null,
  firstName: 'Nirina',
  lastName: 'Rakoto',
  phone: '+261 34 12 345 67',
  email: 'nirina@example.com',
  type: 'ESSAYAGE' as const,
  atelierId: 'atelier-1',
  scheduledAt: new Date('2026-09-01T09:00:00.000Z'),
  message: null,
};

describe('CreateAppointmentUseCase', () => {
  it('throws NotFoundException for an unknown atelier', async () => {
    const { useCase } = buildUseCase({ atelier: null });

    await expect(useCase.execute(BASE_COMMAND)).rejects.toThrow(NotFoundException);
  });

  it('creates the appointment with no customerId for a signed-out visitor', async () => {
    const { useCase, appointmentRepository } = buildUseCase({});

    await useCase.execute(BASE_COMMAND);

    expect(appointmentRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({ customerId: null, firstName: 'Nirina' }),
    );
  });

  it('resolves and links the Customer when userId is provided', async () => {
    const { useCase, appointmentRepository } = buildUseCase({ customer: sampleCustomer() });

    await useCase.execute({ ...BASE_COMMAND, userId: 'user-1' });

    expect(appointmentRepository.create).toHaveBeenCalledWith(expect.objectContaining({ customerId: 'customer-1' }));
  });

  it('throws ConflictException when the exact requested slot is already booked', async () => {
    const { useCase } = buildUseCase({ conflicting: [sampleAppointment(new Date('2026-09-01T09:00:00.000Z'))] });

    await expect(useCase.execute(BASE_COMMAND)).rejects.toThrow(ConflictException);
  });

  it('generates a unique, non-sequential reference', async () => {
    const { useCase, appointmentRepository } = buildUseCase({});

    await useCase.execute(BASE_COMMAND);

    const call = appointmentRepository.create.mock.calls[0][0];
    expect(call.reference).toMatch(/^ANG-RDV-\d{4}-[A-Za-z0-9_-]{8}$/);
  });
});
