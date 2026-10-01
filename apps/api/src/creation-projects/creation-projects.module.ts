import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { CustomersModule } from '../customers/customers.module';
import { AssignCreationProjectUseCase } from './application/use-cases/assign-creation-project.use-case';
import { GetAdminCreationProjectUseCase } from './application/use-cases/get-admin-creation-project.use-case';
import { ListAssignableStaffUseCase } from './application/use-cases/list-assignable-staff.use-case';
import { CreateCreationProjectFromQuoteUseCase } from './application/use-cases/create-creation-project-from-quote.use-case';
import { GetCreationProjectUseCase } from './application/use-cases/get-creation-project.use-case';
import { ListAllCreationProjectsUseCase } from './application/use-cases/list-all-creation-projects.use-case';
import { ListCreationProjectsUseCase } from './application/use-cases/list-creation-projects.use-case';
import { UpdateCreationProjectStageUseCase } from './application/use-cases/update-creation-project-stage.use-case';
import { CREATION_PROJECT_REPOSITORY } from './domain/repositories/creation-project.repository';
import { PrismaCreationProjectRepository } from './infrastructure/repositories/prisma-creation-project.repository';
import { AdminCreationProjectsController } from './presentation/controllers/admin-creation-projects.controller';
import { CreationProjectsController } from './presentation/controllers/creation-projects.controller';

@Module({
  // AuthModule: JwtAuthGuard. CustomersModule: CUSTOMER_REPOSITORY (userId → Customer.id).
  imports: [AuthModule, CustomersModule],
  controllers: [CreationProjectsController, AdminCreationProjectsController],
  providers: [
    ListCreationProjectsUseCase,
    GetCreationProjectUseCase,
    ListAllCreationProjectsUseCase,
    UpdateCreationProjectStageUseCase,
    AssignCreationProjectUseCase,
    GetAdminCreationProjectUseCase,
    ListAssignableStaffUseCase,
    CreateCreationProjectFromQuoteUseCase,
    { provide: CREATION_PROJECT_REPOSITORY, useClass: PrismaCreationProjectRepository },
  ],
  // CreateCreationProjectFromQuoteUseCase : appelé par QuotesModule à l'acceptation d'un devis.
  exports: [CreateCreationProjectFromQuoteUseCase],
})
export class CreationProjectsModule {}
