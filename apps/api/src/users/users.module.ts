import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';
import { ChangeStaffRoleUseCase } from './application/use-cases/change-staff-role.use-case';
import { CreateStaffUserUseCase } from './application/use-cases/create-staff-user.use-case';
import { ListStaffUsersUseCase } from './application/use-cases/list-staff-users.use-case';
import { SetStaffUserStatusUseCase } from './application/use-cases/set-staff-user-status.use-case';
import { STAFF_USER_REPOSITORY } from './domain/repositories/staff-user.repository';
import { PrismaStaffUserRepository } from './infrastructure/repositories/prisma-staff-user.repository';
import { StaffUsersController } from './presentation/controllers/staff-users.controller';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [StaffUsersController],
  providers: [
    ListStaffUsersUseCase,
    CreateStaffUserUseCase,
    ChangeStaffRoleUseCase,
    SetStaffUserStatusUseCase,
    { provide: STAFF_USER_REPOSITORY, useClass: PrismaStaffUserRepository },
  ],
})
export class UsersModule {}
