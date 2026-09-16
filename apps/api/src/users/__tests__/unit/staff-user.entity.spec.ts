import { StaffUserEntity } from '../../domain/entities/staff-user.entity';

function validProps(overrides: Partial<Parameters<typeof StaffUserEntity.create>[0]> = {}) {
  return {
    id: 'user-1',
    email: 'manager@angaly.com',
    role: 'MANAGER' as const,
    isActive: true,
    lastLoginAt: null,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    ...overrides,
  };
}

describe('StaffUserEntity', () => {
  it('creates a valid staff user', () => {
    const entity = StaffUserEntity.create(validProps());

    expect(entity.id).toBe('user-1');
    expect(entity.email).toBe('manager@angaly.com');
    expect(entity.role).toBe('MANAGER');
    expect(entity.isActive).toBe(true);
    expect(entity.lastLoginAt).toBeNull();
  });

  it('rejects an invalid email', () => {
    expect(() => StaffUserEntity.create(validProps({ email: 'not-an-email' }))).toThrow(
      'StaffUser.email must be a valid email address',
    );
  });

  it('rejects a non-staff role (CLIENT)', () => {
    expect(() =>
      // @ts-expect-error deliberately invalid role for the test
      StaffUserEntity.create(validProps({ role: 'CLIENT' })),
    ).toThrow('StaffUser.role must be one of COUTURIERE, MANAGER, ADMIN');
  });
});
