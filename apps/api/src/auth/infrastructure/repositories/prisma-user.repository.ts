import { Injectable } from '@nestjs/common';
import { Prisma } from '@angaly/database';

import { PrismaService } from '../../../prisma/prisma.service';
import { UserEntity } from '../../domain/entities/user.entity';
import { IUserRepository, NewCustomerProfile } from '../../domain/repositories/user.repository';
import type { UserRole } from '../../domain/entities/user.entity';
import { UserMapper } from '../mappers/user.mapper';

export const USER_SELECT = {
  id: true,
  email: true,
  passwordHash: true,
  role: true,
  isActive: true,
  lastLoginAt: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.UserSelect;

export type UserRecord = Prisma.UserGetPayload<{ select: typeof USER_SELECT }>;

@Injectable()
export class PrismaUserRepository implements IUserRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByEmail(email: string): Promise<UserEntity | null> {
    const record = await this.prisma.user.findUnique({ where: { email }, select: USER_SELECT });
    return record ? UserMapper.toDomain(record) : null;
  }

  async findById(id: string): Promise<UserEntity | null> {
    const record = await this.prisma.user.findUnique({ where: { id }, select: USER_SELECT });
    return record ? UserMapper.toDomain(record) : null;
  }

  async createWithCustomer(
    user: { email: string; passwordHash: string; role: UserRole },
    customer: NewCustomerProfile,
  ): Promise<UserEntity> {
    const record = await this.prisma.$transaction(async (tx) => {
      const createdUser = await tx.user.create({
        data: { email: user.email, passwordHash: user.passwordHash, role: user.role },
        select: USER_SELECT,
      });
      await tx.customer.create({
        data: {
          userId: createdUser.id,
          firstName: customer.firstName,
          lastName: customer.lastName,
          phone: customer.phone,
        },
      });
      return createdUser;
    });

    return UserMapper.toDomain(record);
  }

  async updateLastLoginAt(userId: string, at: Date): Promise<void> {
    await this.prisma.user.update({ where: { id: userId }, data: { lastLoginAt: at } });
  }

  async updatePasswordHash(userId: string, passwordHash: string): Promise<void> {
    await this.prisma.user.update({ where: { id: userId }, data: { passwordHash } });
  }
}
