import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { CollectionsModule } from '../collections/collections.module';
import { CreationsModule } from '../creations/creations.module';
import { ProductsModule } from '../products/products.module';
import { AddFavoriteUseCase } from './application/use-cases/add-favorite.use-case';
import { GetCustomerProfileUseCase } from './application/use-cases/get-customer-profile.use-case';
import { ListFavoritesUseCase } from './application/use-cases/list-favorites.use-case';
import { RemoveFavoriteUseCase } from './application/use-cases/remove-favorite.use-case';
import { UpdateCustomerProfileUseCase } from './application/use-cases/update-customer-profile.use-case';
import { CUSTOMER_REPOSITORY } from './domain/repositories/customer.repository';
import { FAVORITE_REPOSITORY } from './domain/repositories/favorite.repository';
import { PrismaCustomerRepository } from './infrastructure/repositories/prisma-customer.repository';
import { PrismaFavoriteRepository } from './infrastructure/repositories/prisma-favorite.repository';
import { CustomersController } from './presentation/controllers/customers.controller';
import { FavoritesController } from './presentation/controllers/favorites.controller';

@Module({
  // AuthModule: JwtAuthGuard (exported) guards both controllers here.
  // CreationsModule/CollectionsModule/ProductsModule: their repository tokens hydrate
  // favorites (list-favorites.use-case.ts) — see docs/features/customers.md "Points d'intégration".
  imports: [AuthModule, CreationsModule, CollectionsModule, ProductsModule],
  controllers: [CustomersController, FavoritesController],
  providers: [
    GetCustomerProfileUseCase,
    UpdateCustomerProfileUseCase,
    AddFavoriteUseCase,
    RemoveFavoriteUseCase,
    ListFavoritesUseCase,
    { provide: CUSTOMER_REPOSITORY, useClass: PrismaCustomerRepository },
    { provide: FAVORITE_REPOSITORY, useClass: PrismaFavoriteRepository },
  ],
  // CUSTOMER_REPOSITORY: `appointments`.create-appointment resolves customerId from userId when connected.
  exports: [CUSTOMER_REPOSITORY],
})
export class CustomersModule {}
