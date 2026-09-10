import { NotFoundException } from '@nestjs/common';

import { AtelierEntity } from '../../../ateliers/domain/entities/atelier.entity';
import type { IAtelierRepository } from '../../../ateliers/domain/repositories/atelier.repository';
import { AppointmentEntity } from '../../domain/entities/appointment.entity';
import type { IAppointmentRepository } from '../../domain/repositories/appointment.repository';
import { GetDaySlotsUseCase } from '../../application/use-cases/get-day-slots.use-case';

const OPEN_TUESDAY = {
  monday: { isOpen: false, slots: [] },
  tuesday: { isOpen: true, slots: [{ open: '09:00', close: '10:30' }] },
  wednesday: { isOpen: false, slots: [] },
  thursday: { isOpen: false, slots: [] },
  friday: { isOpen: false, slots: [] },
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
    openingHours: OPEN_TUESDAY,
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
  };

  return { useCase: new GetDaySlotsUseCase(atelierRepository, appointmentRepository), appointmentRepository };
}

describe('GetDaySlotsUseCase', () => {
  it('throws NotFoundException for an unknown atelier', async () => {
    const { useCase } = buildUseCase({ atelier: null });

    await expect(useCase.execute('missing', '2026-09-01')).rejects.toThrow(NotFoundException);
  });

  it('returns every free slot for an open day (2026-09-01 is a Tuesday)', async () => {
    const { useCase } = buildUseCase({});

    const slots = await useCase.execute('atelier-1', '2026-09-01');

    expect(slots.map((slot) => slot.toISOString())).toEqual([
      '2026-09-01T09:00:00.000Z',
      '2026-09-01T09:45:00.000Z',
    ]);
  });

  it('excludes an already-booked slot', async () => {
    const { useCase } = buildUseCase({ appointments: [sampleAppointment(new Date('2026-09-01T09:00:00.000Z'))] });

    const slots = await useCase.execute('atelier-1', '2026-09-01');

    expect(slots.map((slot) => slot.toISOString())).toEqual(['2026-09-01T09:45:00.000Z']);
  });

  it('queries the repository for exactly that calendar day', async () => {
    const { useCase, appointmentRepository } = buildUseCase({});

    await useCase.execute('atelier-1', '2026-09-01');

    expect(appointmentRepository.listActiveByAtelierAndRange).toHaveBeenCalledWith(
      'atelier-1',
      new Date('2026-09-01T00:00:00.000Z'),
      new Date('2026-09-02T00:00:00.000Z'),
    );
  });
});
