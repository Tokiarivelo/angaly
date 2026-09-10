import { NotFoundException } from '@nestjs/common';

import { AppointmentEntity } from '../../domain/entities/appointment.entity';
import type { IAppointmentRepository } from '../../domain/repositories/appointment.repository';
import { GetAppointmentByReferenceUseCase } from '../../application/use-cases/get-appointment-by-reference.use-case';

function sampleAppointment(): AppointmentEntity {
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
    scheduledAt: new Date(),
    durationMinutes: 45,
    status: 'PENDING',
    message: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

function buildRepository(appointment: AppointmentEntity | null): jest.Mocked<IAppointmentRepository> {
  return {
    findByReference: jest.fn().mockResolvedValue(appointment),
    create: jest.fn(),
    updateStatus: jest.fn(),
    listActiveByAtelierAndRange: jest.fn(),
  };
}

describe('GetAppointmentByReferenceUseCase', () => {
  it('returns the appointment for a known reference', async () => {
    const useCase = new GetAppointmentByReferenceUseCase(buildRepository(sampleAppointment()));

    const result = await useCase.execute('ANG-RDV-2026-AbCdEfGh');

    expect(result.reference).toBe('ANG-RDV-2026-AbCdEfGh');
  });

  it('throws NotFoundException for an unknown reference', async () => {
    const useCase = new GetAppointmentByReferenceUseCase(buildRepository(null));

    await expect(useCase.execute('missing')).rejects.toThrow(NotFoundException);
  });
});
