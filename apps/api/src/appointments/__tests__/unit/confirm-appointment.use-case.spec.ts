import { BadRequestException, NotFoundException } from '@nestjs/common';

import { CustomerEntity } from '../../../customers/domain/entities/customer.entity';
import type { ICustomerRepository } from '../../../customers/domain/repositories/customer.repository';
import type { CreateNotificationUseCase } from '../../../notifications/application/use-cases/create-notification.use-case';
import type { AppointmentStatus } from '../../domain/entities/appointment.entity';
import { AppointmentEntity } from '../../domain/entities/appointment.entity';
import type { IAppointmentRepository } from '../../domain/repositories/appointment.repository';
import { ConfirmAppointmentUseCase } from '../../application/use-cases/confirm-appointment.use-case';

function sampleAppointment(status: AppointmentStatus, customerId: string | null = null): AppointmentEntity {
  return AppointmentEntity.create({
    id: 'appointment-1',
    reference: 'ANG-RDV-2026-AbCdEfGh',
    customerId,
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

function buildRepository(appointment: AppointmentEntity | null, confirmed: AppointmentEntity = sampleAppointment('CONFIRMED')): jest.Mocked<IAppointmentRepository> {
  return {
    findByReference: jest.fn().mockResolvedValue(appointment),
    create: jest.fn(),
    updateStatus: jest.fn().mockResolvedValue(confirmed),
    listActiveByAtelierAndRange: jest.fn(),
    findByCustomerId: jest.fn(),
    findAll: jest.fn(),
  };
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

function buildCustomerRepository(customer: CustomerEntity | null = sampleCustomer()): jest.Mocked<ICustomerRepository> {
  return { findByUserId: jest.fn(), findById: jest.fn().mockResolvedValue(customer), update: jest.fn() };
}

function buildCreateNotificationUseCase(): jest.Mocked<CreateNotificationUseCase> {
  return { execute: jest.fn().mockResolvedValue(undefined) } as unknown as jest.Mocked<CreateNotificationUseCase>;
}

describe('ConfirmAppointmentUseCase', () => {
  it('throws NotFoundException for an unknown reference', async () => {
    const useCase = new ConfirmAppointmentUseCase(buildRepository(null), buildCustomerRepository(), buildCreateNotificationUseCase());

    await expect(useCase.execute('missing', 'staff-1')).rejects.toThrow(NotFoundException);
  });

  it('confirms and assigns a PENDING appointment', async () => {
    const repository = buildRepository(sampleAppointment('PENDING'));
    const useCase = new ConfirmAppointmentUseCase(repository, buildCustomerRepository(), buildCreateNotificationUseCase());

    await useCase.execute('ANG-RDV-2026-AbCdEfGh', 'staff-1');

    expect(repository.updateStatus).toHaveBeenCalledWith('appointment-1', 'CONFIRMED', 'staff-1');
  });

  it.each(['CONFIRMED', 'COMPLETED', 'CANCELLED', 'NO_SHOW'] as const)(
    'rejects confirming a %s appointment',
    async (status) => {
      const repository = buildRepository(sampleAppointment(status));
      const useCase = new ConfirmAppointmentUseCase(repository, buildCustomerRepository(), buildCreateNotificationUseCase());

      await expect(useCase.execute('ANG-RDV-2026-AbCdEfGh', 'staff-1')).rejects.toThrow(BadRequestException);
      expect(repository.updateStatus).not.toHaveBeenCalled();
    },
  );

  it('emits an APPOINTMENT_CONFIRMED notification for a connected customer', async () => {
    const confirmed = sampleAppointment('CONFIRMED', 'customer-1');
    const repository = buildRepository(sampleAppointment('PENDING', 'customer-1'), confirmed);
    const createNotificationUseCase = buildCreateNotificationUseCase();
    const useCase = new ConfirmAppointmentUseCase(repository, buildCustomerRepository(), createNotificationUseCase);

    await useCase.execute('ANG-RDV-2026-AbCdEfGh', 'staff-1');

    expect(createNotificationUseCase.execute).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 'user-1', type: 'APPOINTMENT_CONFIRMED', relatedEntityId: 'appointment-1' }),
    );
  });

  it('skips notifying for an anonymous visitor booking (no linked customer)', async () => {
    const repository = buildRepository(sampleAppointment('PENDING', null), sampleAppointment('CONFIRMED', null));
    const createNotificationUseCase = buildCreateNotificationUseCase();
    const useCase = new ConfirmAppointmentUseCase(repository, buildCustomerRepository(), createNotificationUseCase);

    await useCase.execute('ANG-RDV-2026-AbCdEfGh', 'staff-1');

    expect(createNotificationUseCase.execute).not.toHaveBeenCalled();
  });

  it('does not fail the confirmation when notifying fails', async () => {
    const confirmed = sampleAppointment('CONFIRMED', 'customer-1');
    const repository = buildRepository(sampleAppointment('PENDING', 'customer-1'), confirmed);
    const createNotificationUseCase = buildCreateNotificationUseCase();
    createNotificationUseCase.execute.mockRejectedValue(new Error('notifications down'));
    const useCase = new ConfirmAppointmentUseCase(repository, buildCustomerRepository(), createNotificationUseCase);

    await expect(useCase.execute('ANG-RDV-2026-AbCdEfGh', 'staff-1')).resolves.toBe(confirmed);
  });
});
