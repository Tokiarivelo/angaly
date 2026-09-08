import { UserEntity } from '../../domain/entities/user.entity';
import type { UserRecord } from '../repositories/prisma-user.repository';

export class UserMapper {
  static toDomain(record: UserRecord): UserEntity {
    return UserEntity.create({
      id: record.id,
      email: record.email,
      passwordHash: record.passwordHash,
      role: record.role,
      isActive: record.isActive,
      lastLoginAt: record.lastLoginAt,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    });
  }
}
