import { AppointmentMapper } from '../../infrastructure/mappers/appointment.mapper';
import type { AppointmentRecord } from '../../infrastructure/repositories/prisma-appointment.repository';

function appointmentRecord(overrides: Partial<AppointmentRecord> = {}): AppointmentRecord {
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
    createdAt: new Date('2026-09-01T00:00:00.000Z'),
    updatedAt: new Date('2026-09-01T00:00:00.000Z'),
    ...overrides,
  };
}

describe('AppointmentMapper', () => {
  it('maps a Prisma record to a domain entity', () => {
    const entity = AppointmentMapper.toDomain(appointmentRecord());

    expect(entity.reference).toBe('ANG-RDV-2026-AbCdEfGh');
    expect(entity.type).toBe('ESSAYAGE');
  });

  it('maps a domain entity to a response DTO with ISO date strings', () => {
    const entity = AppointmentMapper.toDomain(appointmentRecord());
    const dto = AppointmentMapper.toResponseDto(entity);

    expect(dto.scheduledAt).toBe('2026-09-15T09:00:00.000Z');
    expect(dto.createdAt).toBe('2026-09-01T00:00:00.000Z');
    expect(dto.customerId).toBeNull();
  });

  it('preserves a linked customerId', () => {
    const entity = AppointmentMapper.toDomain(appointmentRecord({ customerId: 'customer-1' }));
    const dto = AppointmentMapper.toResponseDto(entity);

    expect(dto.customerId).toBe('customer-1');
  });
});
