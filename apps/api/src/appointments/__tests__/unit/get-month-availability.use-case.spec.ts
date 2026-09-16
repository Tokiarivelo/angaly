import { NotFoundException } from '@nestjs/common';

import { AtelierEntity } from '../../../ateliers/domain/entities/atelier.entity';
import type { IAtelierRepository } from '../../../ateliers/domain/repositories/atelier.repository';
import { AppointmentEntity } from '../../domain/entities/appointment.entity';
import type { IAppointmentRepository } from '../../domain/repositories/appointment.repository';
import { GetMonthAvailabilityUseCase } from '../../application/use-cases/get-month-availability.use-case';

const OPEN_EVERY_DAY = {
  monday: { isOpen: true, slots: [{ open: '09:00', close: '10:30' }] },
  tuesday: { isOpen: true, slots: [{ open: '09:00', close: '10:30' }] },
  wednesday: { isOpen: true, slots: [{ open: '09:00', close: '10:30' }] },
  thursday: { isOpen: true, slots: [{ open: '09:00', close: '10:30' }] },
  friday: { isOpen: true, slots: [{ open: '09:00', close: '10:30' }] },
  saturday: { isOpen: false, slots: [] },
  sunday: { isOpen: false, slots: [] },
};

function sampleAtelier(): AtelierEntity {
  return AtelierEntity.create({
    id: 'atelier-1',
    slug: 'antananarivo-centre',
    name: 'Atelier Antananarivo Centre',
    address: '12 Rue de la Paix',
    city: 'Antananarivo',
    phone: null,
    openingHours: OPEN_EVERY_DAY,
    services: [],
    latitude: null,
    longitude: null,
    media: [],
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

function buildUseCase(overrides: { atelier?: AtelierEntity | null; appointments?: AppointmentEntity[] }) {
  const atelierRepository: IAtelierRepository = {
    findBySlug: jest.fn(),
    findById: jest.fn().mockResolvedValue(overrides.atelier !== undefined ? overrides.atelier : sampleAtelier()),
    list: jest.fn(),
  };
  const appointmentRepository: IAppointmentRepository = {
    findByReference: jest.fn(),
    create: jest.fn(),
    updateStatus: jest.fn(),
    listActiveByAtelierAndRange: jest.fn().mockResolvedValue(overrides.appointments ?? []),
    findByCustomerId: jest.fn(),
    findAll: jest.fn(),
  };

  return new GetMonthAvailabilityUseCase(atelierRepository, appointmentRepository);
}

describe('GetMonthAvailabilityUseCase', () => {
  it('throws NotFoundException for an unknown atelier', async () => {
    const useCase = buildUseCase({ atelier: null });

    await expect(useCase.execute('missing', '2026-09')).rejects.toThrow(NotFoundException);
  });

  it('returns one entry per day of the month', async () => {
    const useCase = buildUseCase({});

    const days = await useCase.execute('atelier-1', '2026-09');

    expect(days).toHaveLength(30);
    expect(days[0]?.date).toBe('2026-09-01');
    expect(days[29]?.date).toBe('2026-09-30');
  });

  it('marks a closed weekday as "closed" and an open weekday with no bookings as "available"', async () => {
    const useCase = buildUseCase({});

    const days = await useCase.execute('atelier-1', '2026-09');

    // 2026-09-01 is a Tuesday (open), 2026-09-06 is a Sunday (closed).
    expect(days.find((day) => day.date === '2026-09-01')?.status).toBe('available');
    expect(days.find((day) => day.date === '2026-09-06')?.status).toBe('closed');
  });

  it('marks a day as "full" once every slot that day is booked', async () => {
    const useCase = buildUseCase({
      appointments: [
        sampleAppointment(new Date('2026-09-01T09:00:00.000Z')),
        sampleAppointment(new Date('2026-09-01T09:45:00.000Z')),
      ],
    });

    const days = await useCase.execute('atelier-1', '2026-09');

    expect(days.find((day) => day.date === '2026-09-01')?.status).toBe('full');
  });
});
