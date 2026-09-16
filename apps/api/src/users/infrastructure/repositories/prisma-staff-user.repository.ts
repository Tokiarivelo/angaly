import { Injectable } from '@nestjs/common';
import { Prisma } from '@angaly/database';

import { PrismaService } from '../../../prisma/prisma.service';
import { StaffRole, StaffUserEntity } from '../../domain/entities/staff-user.entity';
import {
  CreateStaffUserInput,
  IStaffUserRepository,
  StaffUserListFilter,
  StaffUserListResult,
} from '../../domain/repositories/staff-user.repository';
import { StaffUserMapper } from '../mappers/staff-user.mapper';

/** Every query here is scoped to `role != CLIENT` — this module never touches CLIENT rows (see docs/features/users.md). */
const STAFF_ONLY: Prisma.UserWhereInput = { role: { not: 'CLIENT' } };

@Injectable()
export class PrismaStaffUserRepository implements IStaffUserRepository {
  constructor(private readonly prisma: PrismaService) {}

  async list(filter: StaffUserListFilter): Promise<StaffUserListResult> {
    const where: Prisma.UserWhereInput = {
      ...STAFF_ONLY,
      ...(filter.role ? { role: filter.role } : {}),
      ...(filter.isActive !== undefined ? { isActive: filter.isActive } : {}),
    };

    const [records, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (filter.page - 1) * filter.limit,
        take: filter.limit,
      }),
      this.prisma.user.count({ where }),
    ]);

    return { items: records.map((record) => StaffUserMapper.toDomain(record)), total };
  }

  async findById(id: string): Promise<StaffUserEntity | null> {
    const record = await this.prisma.user.findFirst({ where: { id, ...STAFF_ONLY } });
    return record ? StaffUserMapper.toDomain(record) : null;
  }

  async findByEmail(email: string): Promise<StaffUserEntity | null> {
    const record = await this.prisma.user.findFirst({ where: { email, ...STAFF_ONLY } });
    return record ? StaffUserMapper.toDomain(record) : null;
  }

  async create(input: CreateStaffUserInput): Promise<StaffUserEntity> {
    const record = await this.prisma.user.create({
      data: { email: input.email, passwordHash: input.passwordHash, role: input.role },
    });
    return StaffUserMapper.toDomain(record);
  }

  async updateRole(id: string, role: StaffRole): Promise<StaffUserEntity> {
    const record = await this.prisma.user.update({ where: { id }, data: { role } });
    return StaffUserMapper.toDomain(record);
  }

  async setActive(id: string, isActive: boolean): Promise<StaffUserEntity> {
    const record = await this.prisma.user.update({ where: { id }, data: { isActive } });
    return StaffUserMapper.toDomain(record);
  }
}
