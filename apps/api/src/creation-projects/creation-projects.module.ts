import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { CustomersModule } from '../customers/customers.module';
import { PatternEngineModule } from '../pattern-engine/pattern-engine.module';
import { AiInferenceModule } from '../ai-inference/ai-inference.module';
import { AddCreationProjectStageMediaUseCase } from './application/use-cases/add-creation-project-stage-media.use-case';
import { AddCreationProjectStageNoteUseCase } from './application/use-cases/add-creation-project-stage-note.use-case';
import { AssignCreationProjectUseCase } from './application/use-cases/assign-creation-project.use-case';
import { CreateAdminCreationProjectUseCase } from './application/use-cases/create-admin-creation-project.use-case';
import { CreateCreationProjectFromQuoteUseCase } from './application/use-cases/create-creation-project-from-quote.use-case';
import { DeleteCreationProjectStageMediaUseCase } from './application/use-cases/delete-creation-project-stage-media.use-case';
import { DeleteCreationProjectStageNoteUseCase } from './application/use-cases/delete-creation-project-stage-note.use-case';
import { GenerateCreationProjectAiPatternUseCase } from './application/use-cases/generate-creation-project-ai-pattern.use-case';
import { GetAdminCreationProjectUseCase } from './application/use-cases/get-admin-creation-project.use-case';
import { GetCreationProjectUseCase } from './application/use-cases/get-creation-project.use-case';
import { ListAllCreationProjectsUseCase } from './application/use-cases/list-all-creation-projects.use-case';
import { ListAssignableStaffUseCase } from './application/use-cases/list-assignable-staff.use-case';
import { ListCustomersLookupUseCase } from './application/use-cases/list-customers-lookup.use-case';
import { ListQuotesLookupUseCase } from './application/use-cases/list-quotes-lookup.use-case';
import { ListCreationProjectsUseCase } from './application/use-cases/list-creation-projects.use-case';
import { UpdateCreationProjectStageUseCase } from './application/use-cases/update-creation-project-stage.use-case';
import { CREATION_PROJECT_REPOSITORY } from './domain/repositories/creation-project.repository';
import { PrismaCreationProjectRepository } from './infrastructure/repositories/prisma-creation-project.repository';
import { AdminCreationProjectsController } from './presentation/controllers/admin-creation-projects.controller';
import { CreationProjectsController } from './presentation/controllers/creation-projects.controller';

@Module({
  // AuthModule: JwtAuthGuard. CustomersModule: CUSTOMER_REPOSITORY (userId → Customer.id).
  // PatternEngineModule: generatePatternPiecesUseCase. AiInferenceModule: suggestPatternParametersUseCase.
  imports: [AuthModule, CustomersModule, PatternEngineModule, AiInferenceModule],
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
    CreateAdminCreationProjectUseCase,
    ListCustomersLookupUseCase,
    ListQuotesLookupUseCase,
    AddCreationProjectStageNoteUseCase,
    DeleteCreationProjectStageNoteUseCase,
    AddCreationProjectStageMediaUseCase,
    DeleteCreationProjectStageMediaUseCase,
    GenerateCreationProjectAiPatternUseCase,
    { provide: CREATION_PROJECT_REPOSITORY, useClass: PrismaCreationProjectRepository },
  ],
  // CreateCreationProjectFromQuoteUseCase : appelé par QuotesModule à l'acceptation d'un devis.
  exports: [CreateCreationProjectFromQuoteUseCase],
})
export class CreationProjectsModule {}
