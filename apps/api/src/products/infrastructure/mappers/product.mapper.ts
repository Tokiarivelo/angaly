import type { ProductAvailability as SharedProductAvailability } from '@angaly/types';

import { ProductResponseDto } from '../../application/dtos/product-response.dto';
import { ProductVariantResponseDto } from '../../application/dtos/product-variant-response.dto';
import { ProductEntity } from '../../domain/entities/product.entity';
import { ProductVariantEntity } from '../../domain/entities/product-variant.entity';
import type { Price } from '../../domain/value-objects/price.vo';
import type { ProductRecord, ProductVariantRecord } from '../repositories/prisma-product.repository';

export class ProductMapper {
  static variantToDomain(record: ProductVariantRecord): ProductVariantEntity {
    return ProductVariantEntity.create({
      id: record.id,
      productId: record.productId,
      sku: record.sku,
      size: record.size,
      color: record.color,
      material: record.material,
      priceOverride: record.priceOverride
        ? { amount: record.priceOverride.toString(), currency: 'MGA' }
        : null,
      quantityAvailable: record.inventory?.quantityAvailable ?? 0,
      quantityReserved: record.inventory?.quantityReserved ?? 0,
    });
  }

  static toDomain(record: ProductRecord): ProductEntity {
    const price: Price = { amount: record.price.toString(), currency: record.currency };

    return ProductEntity.create({
      id: record.id,
      sku: record.sku,
      slug: record.slug,
      name: record.name,
      description: record.description,
      price,
      status: record.status,
      category: record.category,
      media: record.media.map((media) => ({ ...media, altText: media.altText ?? '' })),
      variants: record.variants.map((variant) => ProductMapper.variantToDomain(variant)),
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    });
  }

  static variantToResponseDto(entity: ProductVariantEntity): ProductVariantResponseDto {
    const dto = new ProductVariantResponseDto();
    dto.id = entity.id;
    dto.sku = entity.sku;
    dto.size = entity.size;
    dto.color = entity.color;
    dto.material = entity.material;
    dto.priceOverride = entity.priceOverride;
    dto.quantityAvailable = entity.quantityAvailable;
    dto.quantityReserved = entity.quantityReserved;
    return dto;
  }

  static toResponseDto(entity: ProductEntity): ProductResponseDto {
    const dto = new ProductResponseDto();
    dto.id = entity.id;
    dto.sku = entity.sku;
    dto.slug = entity.slug;
    dto.name = entity.name;
    dto.description = entity.description;
    dto.price = entity.price;
    dto.status = entity.status as SharedProductAvailability;
    dto.category = entity.category;
    dto.media = entity.media;
    dto.variants = entity.variants.map((variant) => ProductMapper.variantToResponseDto(variant));
    dto.createdAt = entity.createdAt.toISOString();
    dto.updatedAt = entity.updatedAt.toISOString();
    return dto;
  }
}
