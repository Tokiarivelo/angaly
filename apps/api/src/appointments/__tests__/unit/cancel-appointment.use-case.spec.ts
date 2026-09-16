import { BadRequestException, NotFoundException } from '@nestjs/common';

import type { AppointmentStatus } from '../../domain/entities/appointment.entity';
import { AppointmentEntity } from '../../domain/entities/appointment.entity';
import type { IAppointmentRepository } from '../../domain/repositories/appointment.repository';
import { CancelAppointmentUseCase } from '../../application/use-cases/cancel-appointment.use-case';

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
    updateStatus: jest.fn().mockResolvedValue(sampleAppointment('CANCELLED')),
    listActiveByAtelierAndRange: jest.fn(),
    findByCustomerId: jest.fn(),
    findAll: jest.fn(),
  };
}

describe('CancelAppointmentUseCase', () => {
  it('throws NotFoundException for an unknown reference', async () => {
    const useCase = new CancelAppointmentUseCase(buildRepository(null));

    await expect(useCase.execute('missing')).rejects.toThrow(NotFoundException);
  });

  it.each(['PENDING', 'CONFIRMED'] as const)('cancels a %s appointment', async (status) => {
    const repository = buildRepository(sampleAppointment(status));
    const useCase = new CancelAppointmentUseCase(repository);

    await useCase.execute('ANG-RDV-2026-AbCdEfGh');

    expect(repository.updateStatus).toHaveBeenCalledWith('appointment-1', 'CANCELLED');
  });

  it.each(['COMPLETED', 'CANCELLED', 'NO_SHOW'] as const)('rejects cancelling a %s appointment', async (status) => {
    const repository = buildRepository(sampleAppointment(status));
    const useCase = new CancelAppointmentUseCase(repository);

    await expect(useCase.execute('ANG-RDV-2026-AbCdEfGh')).rejects.toThrow(BadRequestException);
    expect(repository.updateStatus).not.toHaveBeenCalled();
  });
});
