import type { AppointmentProps } from '../../domain/entities/appointment.entity';
import { AppointmentEntity } from '../../domain/entities/appointment.entity';

function baseProps(): AppointmentProps {
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
  };
}

describe('AppointmentEntity', () => {
  it('creates a valid entity and exposes its properties via getters', () => {
    const entity = AppointmentEntity.create(baseProps());

    expect(entity.reference).toBe('ANG-RDV-2026-AbCdEfGh');
    expect(entity.type).toBe('ESSAYAGE');
    expect(entity.status).toBe('PENDING');
  });

  it('accepts a connected customerId', () => {
    const entity = AppointmentEntity.create({ ...baseProps(), customerId: 'customer-1' });
    expect(entity.customerId).toBe('customer-1');
  });

  it.each(['reference', 'firstName', 'lastName', 'phone', 'email'] as const)(
    'rejects an empty %s',
    (field) => {
      expect(() => AppointmentEntity.create({ ...baseProps(), [field]: '  ' })).toThrow();
    },
  );

  it('rejects an unknown type', () => {
    expect(() => AppointmentEntity.create({ ...baseProps(), type: 'UNKNOWN' })).toThrow(
      'Appointment.type must be a recognized AppointmentType, got "UNKNOWN"',
    );
  });

  it('rejects an unknown status', () => {
    expect(() => AppointmentEntity.create({ ...baseProps(), status: 'UNKNOWN' })).toThrow(
      'Appointment.status must be a recognized AppointmentStatus, got "UNKNOWN"',
    );
  });
});
