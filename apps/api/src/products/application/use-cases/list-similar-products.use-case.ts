import { Inject, Injectable } from '@nestjs/common';

import { ProductEntity } from '../../domain/entities/product.entity';
import {
  IProductRepository,
  PRODUCT_REPOSITORY,
  SimilarProductsFilter,
} from '../../domain/repositories/product.repository';

@Injectable()
export class ListSimilarProductsUseCase {
  constructor(@Inject(PRODUCT_REPOSITORY) private readonly productRepository: IProductRepository) {}

  execute(filter: SimilarProductsFilter): Promise<ProductEntity[]> {
    return this.productRepository.listSimilar(filter);
  }
}
