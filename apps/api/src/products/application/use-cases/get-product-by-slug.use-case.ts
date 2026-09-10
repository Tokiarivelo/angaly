import { Inject, Injectable, NotFoundException } from '@nestjs/common';

import { ProductEntity } from '../../domain/entities/product.entity';
import { IProductRepository, PRODUCT_REPOSITORY } from '../../domain/repositories/product.repository';

@Injectable()
export class GetProductBySlugUseCase {
  constructor(@Inject(PRODUCT_REPOSITORY) private readonly productRepository: IProductRepository) {}

  async execute(slug: string): Promise<ProductEntity> {
    const product = await this.productRepository.findBySlug(slug);
    if (!product) {
      throw new NotFoundException(`Product with slug "${slug}" not found`);
    }
    return product;
  }
}
