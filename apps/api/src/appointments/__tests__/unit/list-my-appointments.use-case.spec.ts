import { CustomerEntity } from '../../../customers/domain/entities/customer.entity';
import type { ICustomerRepository } from '../../../customers/domain/repositories/customer.repository';
import { AppointmentEntity } from '../../domain/entities/appointment.entity';
import type { IAppointmentRepository } from '../../domain/repositories/appointment.repository';
import { ListMyAppointmentsUseCase } from '../../application/use-cases/list-my-appointments.use-case';

function sampleAppointment(id: string, customerId: string | null): AppointmentEntity {
  return AppointmentEntity.create({
    id,
    reference: `ANG-RDV-2026-${id}`,
    customerId,
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
    createdAt: new Date('2026-09-01T00:00:00.000Z'),
    updatedAt: new Date('2026-09-01T00:00:00.000Z'),
  });
}

function buildAppointmentRepository(): jest.Mocked<IAppointmentRepository> {
  return {
    findByReference: jest.fn(),
    create: jest.fn(),
    updateStatus: jest.fn(),
    listActiveByAtelierAndRange: jest.fn(),
    findByCustomerId: jest.fn().mockResolvedValue([sampleAppointment('appointment-1', 'customer-1')]),
    findAll: jest
      .fn()
      .mockResolvedValue([sampleAppointment('appointment-1', 'customer-1'), sampleAppointment('appointment-2', 'customer-2')]),
  };
}

function buildCustomerRepository(): jest.Mocked<ICustomerRepository> {
  const customer = CustomerEntity.create({
    id: 'customer-1',
    userId: 'user-1',
    firstName: 'Nirina',
    lastName: 'Rakoto',
    phone: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  return { findByUserId: jest.fn().mockResolvedValue(customer), findById: jest.fn(), update: jest.fn() };
}

describe('ListMyAppointmentsUseCase', () => {
  it('returns only the caller’s own appointments for CLIENT', async () => {
    const appointmentRepository = buildAppointmentRepository();
    const useCase = new ListMyAppointmentsUseCase(appointmentRepository, buildCustomerRepository());

    const appointments = await useCase.execute('user-1', 'CLIENT');

    expect(appointments).toHaveLength(1);
    expect(appointmentRepository.findByCustomerId).toHaveBeenCalledWith('customer-1');
    expect(appointmentRepository.findAll).not.toHaveBeenCalled();
  });

  it('returns every appointment for MANAGER', async () => {
    const appointmentRepository = buildAppointmentRepository();
    const useCase = new ListMyAppointmentsUseCase(appointmentRepository, buildCustomerRepository());

    const appointments = await useCase.execute('staff-user', 'MANAGER');

    expect(appointments).toHaveLength(2);
    expect(appointmentRepository.findByCustomerId).not.toHaveBeenCalled();
  });

  it('returns every appointment for ADMIN', async () => {
    const appointmentRepository = buildAppointmentRepository();
    const useCase = new ListMyAppointmentsUseCase(appointmentRepository, buildCustomerRepository());

    const appointments = await useCase.execute('staff-user', 'ADMIN');

    expect(appointments).toHaveLength(2);
  });
});
