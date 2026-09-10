import { Module } from '@nestjs/common';

import { CheckVariantAvailabilityUseCase } from './application/use-cases/check-variant-availability.use-case';
import { GetProductBySlugUseCase } from './application/use-cases/get-product-by-slug.use-case';
import { ListProductsUseCase } from './application/use-cases/list-products.use-case';
import { ListSimilarProductsUseCase } from './application/use-cases/list-similar-products.use-case';
import { PRODUCT_REPOSITORY } from './domain/repositories/product.repository';
import { PrismaProductRepository } from './infrastructure/repositories/prisma-product.repository';
import { ProductsController } from './presentation/controllers/products.controller';

@Module({
  controllers: [ProductsController],
  providers: [
    ListProductsUseCase,
    GetProductBySlugUseCase,
    ListSimilarProductsUseCase,
    CheckVariantAvailabilityUseCase,
    { provide: PRODUCT_REPOSITORY, useClass: PrismaProductRepository },
  ],
  // PRODUCT_REPOSITORY: exported for `orders` (Phase 3) to inject CheckVariantAvailabilityUseCase directly.
  exports: [PRODUCT_REPOSITORY, CheckVariantAvailabilityUseCase],
})
export class ProductsModule {}
