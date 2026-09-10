import type { CustomerProps } from '../../domain/entities/customer.entity';
import { CustomerEntity } from '../../domain/entities/customer.entity';

function baseProps(): CustomerProps {
  return {
    id: 'customer-1',
    userId: 'user-1',
    firstName: 'Nirina',
    lastName: 'Rakoto',
    phone: '+261 34 12 345 67',
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-02T00:00:00.000Z'),
  };
}

describe('CustomerEntity', () => {
  it('creates a valid entity and exposes its properties via getters', () => {
    const entity = CustomerEntity.create(baseProps());

    expect(entity.id).toBe('customer-1');
    expect(entity.userId).toBe('user-1');
    expect(entity.firstName).toBe('Nirina');
    expect(entity.lastName).toBe('Rakoto');
    expect(entity.phone).toBe('+261 34 12 345 67');
  });

  it('accepts a null phone', () => {
    const entity = CustomerEntity.create({ ...baseProps(), phone: null });
    expect(entity.phone).toBeNull();
  });

  it('rejects an empty firstName', () => {
    expect(() => CustomerEntity.create({ ...baseProps(), firstName: '  ' })).toThrow(
      'Customer.firstName must not be empty',
    );
  });

  it('rejects an empty lastName', () => {
    expect(() => CustomerEntity.create({ ...baseProps(), lastName: '' })).toThrow(
      'Customer.lastName must not be empty',
    );
  });
});
