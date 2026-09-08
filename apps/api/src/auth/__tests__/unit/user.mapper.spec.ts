import { UserMapper } from '../../infrastructure/mappers/user.mapper';
import type { UserRecord } from '../../infrastructure/repositories/prisma-user.repository';

function userRecord(overrides: Partial<UserRecord> = {}): UserRecord {
  return {
    id: 'user-1',
    email: 'client@example.com',
    passwordHash: 'hashed',
    role: 'CLIENT',
    isActive: true,
    lastLoginAt: null,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-02T00:00:00.000Z'),
    ...overrides,
  };
}

describe('UserMapper', () => {
  it('maps a Prisma record to a domain entity', () => {
    const entity = UserMapper.toDomain(userRecord());

    expect(entity.id).toBe('user-1');
    expect(entity.email).toBe('client@example.com');
    expect(entity.role).toBe('CLIENT');
    expect(entity.passwordHash).toBe('hashed');
  });

  it('preserves lastLoginAt when set', () => {
    const lastLoginAt = new Date('2026-02-01T00:00:00.000Z');
    const entity = UserMapper.toDomain(userRecord({ lastLoginAt }));

    expect(entity.lastLoginAt).toEqual(lastLoginAt);
  });
});
