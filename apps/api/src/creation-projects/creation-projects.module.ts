import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { CustomersModule } from '../customers/customers.module';
import { GetCreationProjectUseCase } from './application/use-cases/get-creation-project.use-case';
import { ListCreationProjectsUseCase } from './application/use-cases/list-creation-projects.use-case';
import { CREATION_PROJECT_REPOSITORY } from './domain/repositories/creation-project.repository';
import { PrismaCreationProjectRepository } from './infrastructure/repositories/prisma-creation-project.repository';
import { CreationProjectsController } from './presentation/controllers/creation-projects.controller';

@Module({
  // AuthModule: JwtAuthGuard. CustomersModule: CUSTOMER_REPOSITORY (userId → Customer.id).
  imports: [AuthModule, CustomersModule],
  controllers: [CreationProjectsController],
  providers: [
    ListCreationProjectsUseCase,
    GetCreationProjectUseCase,
    { provide: CREATION_PROJECT_REPOSITORY, useClass: PrismaCreationProjectRepository },
  ],
})
export class CreationProjectsModule {}
