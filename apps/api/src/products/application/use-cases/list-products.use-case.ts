import { Inject, Injectable } from '@nestjs/common';

import {
  IProductRepository,
  PRODUCT_REPOSITORY,
  ProductListFilter,
  ProductListResult,
} from '../../domain/repositories/product.repository';

@Injectable()
export class ListProductsUseCase {
  constructor(@Inject(PRODUCT_REPOSITORY) private readonly productRepository: IProductRepository) {}

  execute(filter: ProductListFilter): Promise<ProductListResult> {
    return this.productRepository.list(filter);
  }
}
