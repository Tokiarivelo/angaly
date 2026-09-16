import type { User as PrismaUser } from '@angaly/database';

import { StaffUserMapper } from '../../infrastructure/mappers/staff-user.mapper';

function buildRecord(overrides: Partial<PrismaUser> = {}): PrismaUser {
  return {
    id: 'user-1',
    email: 'manager@angaly.com',
    passwordHash: 'hashed',
    role: 'MANAGER',
    isActive: true,
    lastLoginAt: null,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-02T00:00:00.000Z'),
    ...overrides,
  };
}

describe('StaffUserMapper', () => {
  it('maps a Prisma record to a domain entity', () => {
    const entity = StaffUserMapper.toDomain(buildRecord());

    expect(entity.id).toBe('user-1');
    expect(entity.role).toBe('MANAGER');
  });

  it('maps a domain entity to a response DTO', () => {
    const entity = StaffUserMapper.toDomain(buildRecord({ lastLoginAt: new Date('2026-01-03T00:00:00.000Z') }));
    const dto = StaffUserMapper.toResponseDto(entity);

    expect(dto).toMatchObject({
      id: 'user-1',
      email: 'manager@angaly.com',
      role: 'MANAGER',
      isActive: true,
      lastLoginAt: '2026-01-03T00:00:00.000Z',
    });
  });

  it('maps a null lastLoginAt to null in the response DTO', () => {
    const entity = StaffUserMapper.toDomain(buildRecord({ lastLoginAt: null }));
    const dto = StaffUserMapper.toResponseDto(entity);

    expect(dto.lastLoginAt).toBeNull();
  });
});
