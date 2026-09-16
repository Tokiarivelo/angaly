import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';
import { GetSectionUseCase } from './application/use-cases/get-section.use-case';
import { ListSectionsUseCase } from './application/use-cases/list-sections.use-case';
import { ListSectionVersionsUseCase } from './application/use-cases/list-section-versions.use-case';
import { PublishSectionUseCase } from './application/use-cases/publish-section.use-case';
import { RestoreSectionVersionUseCase } from './application/use-cases/restore-section-version.use-case';
import { SaveSectionDraftUseCase } from './application/use-cases/save-section-draft.use-case';
import { PAGE_SECTION_REPOSITORY } from './domain/repositories/page-section.repository';
import { PrismaPageSectionRepository } from './infrastructure/repositories/prisma-page-section.repository';
import { PageSectionsController } from './presentation/controllers/page-sections.controller';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [PageSectionsController],
  providers: [
    ListSectionsUseCase,
    GetSectionUseCase,
    SaveSectionDraftUseCase,
    PublishSectionUseCase,
    ListSectionVersionsUseCase,
    RestoreSectionVersionUseCase,
    { provide: PAGE_SECTION_REPOSITORY, useClass: PrismaPageSectionRepository },
  ],
})
export class ContentModule {}
