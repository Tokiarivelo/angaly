import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { CustomersModule } from '../customers/customers.module';
import { PatternsModule } from '../patterns/patterns.module';
import { PrismaModule } from '../prisma/prisma.module';
import { CreateProjectFromCatalogUseCase } from './application/use-cases/create-project-from-catalog.use-case';
import { ListPatternCatalogUseCase } from './application/use-cases/list-pattern-catalog.use-case';
import { CATALOG_IMAGE_REPOSITORY, PATTERN_CATALOG_SOURCE } from './domain/catalog-entry';
import { EngineCatalogSource } from './infrastructure/engine-catalog.source';
import { PrismaCatalogImageRepository } from './infrastructure/prisma-catalog-image.repository';
import { PatternCatalogController } from './presentation/controllers/pattern-catalog.controller';

/** « Catalogue des patrons »: the dresses the engine can make, and a project started from one. */
@Module({
  imports: [PrismaModule, AuthModule, CustomersModule, PatternsModule],
  controllers: [PatternCatalogController],
  providers: [
    ListPatternCatalogUseCase,
    CreateProjectFromCatalogUseCase,
    { provide: PATTERN_CATALOG_SOURCE, useClass: EngineCatalogSource },
    { provide: CATALOG_IMAGE_REPOSITORY, useClass: PrismaCatalogImageRepository },
  ],
})
export class PatternCatalogModule {}
