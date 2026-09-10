import { Inject, Injectable, NotFoundException } from '@nestjs/common';

import { IProductRepository, PRODUCT_REPOSITORY } from '../../domain/repositories/product.repository';

export interface VariantAvailability {
  variantId: string;
  quantityAvailable: number;
  quantityReserved: number;
  availableToSell: number;
  isAvailable: boolean;
}

/**
 * Internal read path — not exposed as a public write by this module (see
 * docs/features/products.md "Cas d'usage clés"). `orders` (Phase 3) injects
 * this use-case directly (via PRODUCT_REPOSITORY's module export) before
 * decrementing Inventory at order confirmation; this module stays the only
 * source of truth on stock.
 */
@Injectable()
export class CheckVariantAvailabilityUseCase {
  constructor(@Inject(PRODUCT_REPOSITORY) private readonly productRepository: IProductRepository) {}

  async execute(variantId: string, requestedQuantity = 1): Promise<VariantAvailability> {
    const variant = await this.productRepository.findVariantById(variantId);
    if (!variant) {
      throw new NotFoundException(`Product variant "${variantId}" not found`);
    }

    return {
      variantId: variant.id,
      quantityAvailable: variant.quantityAvailable,
      quantityReserved: variant.quantityReserved,
      availableToSell: variant.availableToSell,
      isAvailable: variant.availableToSell >= requestedQuantity,
    };
  }
}
