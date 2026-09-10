import { BadRequestException, NotFoundException } from '@nestjs/common';

import type { AppointmentStatus } from '../../domain/entities/appointment.entity';
import { AppointmentEntity } from '../../domain/entities/appointment.entity';
import type { IAppointmentRepository } from '../../domain/repositories/appointment.repository';
import { ConfirmAppointmentUseCase } from '../../application/use-cases/confirm-appointment.use-case';

function sampleAppointment(status: AppointmentStatus): AppointmentEntity {
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
    status,
    message: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

function buildRepository(appointment: AppointmentEntity | null): jest.Mocked<IAppointmentRepository> {
  return {
    findByReference: jest.fn().mockResolvedValue(appointment),
    create: jest.fn(),
    updateStatus: jest.fn().mockResolvedValue(sampleAppointment('CONFIRMED')),
    listActiveByAtelierAndRange: jest.fn(),
  };
}

describe('ConfirmAppointmentUseCase', () => {
  it('throws NotFoundException for an unknown reference', async () => {
    const useCase = new ConfirmAppointmentUseCase(buildRepository(null));

    await expect(useCase.execute('missing', 'staff-1')).rejects.toThrow(NotFoundException);
  });

  it('confirms and assigns a PENDING appointment', async () => {
    const repository = buildRepository(sampleAppointment('PENDING'));
    const useCase = new ConfirmAppointmentUseCase(repository);

    await useCase.execute('ANG-RDV-2026-AbCdEfGh', 'staff-1');

    expect(repository.updateStatus).toHaveBeenCalledWith('appointment-1', 'CONFIRMED', 'staff-1');
  });

  it.each(['CONFIRMED', 'COMPLETED', 'CANCELLED', 'NO_SHOW'] as const)(
    'rejects confirming a %s appointment',
    async (status) => {
      const repository = buildRepository(sampleAppointment(status));
      const useCase = new ConfirmAppointmentUseCase(repository);

      await expect(useCase.execute('ANG-RDV-2026-AbCdEfGh', 'staff-1')).rejects.toThrow(BadRequestException);
      expect(repository.updateStatus).not.toHaveBeenCalled();
    },
  );
});
