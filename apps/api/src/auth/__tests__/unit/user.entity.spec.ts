import type { UserProps } from '../../domain/entities/user.entity';
import { UserEntity } from '../../domain/entities/user.entity';

function baseProps(): UserProps {
  return {
    id: 'user-1',
    email: 'client@example.com',
    passwordHash: '$2b$12$hashedvalue',
    role: 'CLIENT',
    isActive: true,
    lastLoginAt: null,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-02T00:00:00.000Z'),
  };
}

describe('UserEntity', () => {
  it('creates a valid entity and exposes its properties via getters', () => {
    const entity = UserEntity.create(baseProps());

    expect(entity.id).toBe('user-1');
    expect(entity.email).toBe('client@example.com');
    expect(entity.role).toBe('CLIENT');
    expect(entity.isActive).toBe(true);
    expect(entity.lastLoginAt).toBeNull();
  });

  it('rejects a malformed email', () => {
    expect(() => UserEntity.create({ ...baseProps(), email: 'not-an-email' })).toThrow(
      'User.email must be a valid email address',
    );
  });

  it('rejects an unknown role', () => {
    expect(() => UserEntity.create({ ...baseProps(), role: 'SUPERADMIN' as never })).toThrow(
      /User\.role must be one of/,
    );
  });
});
