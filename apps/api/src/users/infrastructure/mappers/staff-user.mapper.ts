import type { User as PrismaUser } from '@angaly/database';
import type { Role as SharedRole } from '@angaly/types';

import { StaffUserResponseDto } from '../../application/dtos/staff-user-response.dto';
import type { StaffRole } from '../../domain/entities/staff-user.entity';
import { StaffUserEntity } from '../../domain/entities/staff-user.entity';

export class StaffUserMapper {
  static toDomain(record: PrismaUser): StaffUserEntity {
    return StaffUserEntity.create({
      id: record.id,
      email: record.email,
      role: record.role as StaffRole,
      isActive: record.isActive,
      lastLoginAt: record.lastLoginAt,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    });
  }

  static toResponseDto(entity: StaffUserEntity): StaffUserResponseDto {
    const dto = new StaffUserResponseDto();
    dto.id = entity.id;
    dto.email = entity.email;
    dto.role = entity.role as SharedRole;
    dto.isActive = entity.isActive;
    dto.lastLoginAt = entity.lastLoginAt ? entity.lastLoginAt.toISOString() : null;
    dto.createdAt = entity.createdAt.toISOString();
    dto.updatedAt = entity.updatedAt.toISOString();
    return dto;
  }
}
