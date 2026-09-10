import { Injectable } from '@nestjs/common';
import { Prisma } from '@angaly/database';

import { PrismaService } from '../../../prisma/prisma.service';
import { ProductEntity } from '../../domain/entities/product.entity';
import { ProductVariantEntity } from '../../domain/entities/product-variant.entity';
import {
  IProductRepository,
  ProductListFilter,
  ProductListResult,
  SimilarProductsFilter,
} from '../../domain/repositories/product.repository';
import { ProductMapper } from '../mappers/product.mapper';

export const PRODUCT_VARIANT_SELECT = {
  id: true,
  productId: true,
  sku: true,
  size: true,
  color: true,
  material: true,
  priceOverride: true,
  inventory: { select: { quantityAvailable: true, quantityReserved: true } },
} satisfies Prisma.ProductVariantSelect;

export type ProductVariantRecord = Prisma.ProductVariantGetPayload<{ select: typeof PRODUCT_VARIANT_SELECT }>;

export const PRODUCT_DETAIL_SELECT = {
  id: true,
  sku: true,
  slug: true,
  name: true,
  description: true,
  price: true,
  currency: true,
  status: true,
  createdAt: true,
  updatedAt: true,
  category: { select: { id: true, slug: true, name: true } },
  media: {
    orderBy: { sortOrder: 'asc' },
    select: { id: true, url: true, altText: true, sortOrder: true },
  },
  variants: { select: PRODUCT_VARIANT_SELECT },
} satisfies Prisma.ProductSelect;

export type ProductRecord = Prisma.ProductGetPayload<{ select: typeof PRODUCT_DETAIL_SELECT }>;

function buildWhere(filter: ProductListFilter | SimilarProductsFilter): Prisma.ProductWhereInput {
  const where: Prisma.ProductWhereInput = { categoryId: filter.categoryId };

  if ('excludeProductId' in filter) {
    return { ...where, id: { not: filter.excludeProductId } };
  }

  const variantSome: Prisma.ProductVariantWhereInput = {};
  if (filter.size) variantSome.size = filter.size;
  if (filter.color) variantSome.color = filter.color;
  if (filter.material) variantSome.material = filter.material;
  if (Object.keys(variantSome).length > 0) {
    where.variants = { some: variantSome };
  }

  if (filter.status) {
    where.status = filter.status;
  }

  if (filter.priceMin || filter.priceMax) {
    where.price = {
      ...(filter.priceMin ? { gte: filter.priceMin } : {}),
      ...(filter.priceMax ? { lte: filter.priceMax } : {}),
    };
  }

  return where;
}

function buildOrderBy(sort: ProductListFilter['sort']): Prisma.ProductOrderByWithRelationInput[] {
  if (sort === 'priceAsc') {
    return [{ price: 'asc' }];
  }
  if (sort === 'priceDesc') {
    return [{ price: 'desc' }];
  }
  return [{ createdAt: 'desc' }];
}

@Injectable()
export class PrismaProductRepository implements IProductRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findBySlug(slug: string): Promise<ProductEntity | null> {
    const record = await this.prisma.product.findUnique({ where: { slug }, select: PRODUCT_DETAIL_SELECT });
    return record ? ProductMapper.toDomain(record) : null;
  }

  async findById(id: string): Promise<ProductEntity | null> {
    const record = await this.prisma.product.findUnique({ where: { id }, select: PRODUCT_DETAIL_SELECT });
    return record ? ProductMapper.toDomain(record) : null;
  }

  async list(filter: ProductListFilter): Promise<ProductListResult> {
    const where = buildWhere(filter);

    const [records, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        select: PRODUCT_DETAIL_SELECT,
        orderBy: buildOrderBy(filter.sort),
        skip: (filter.page - 1) * filter.limit,
        take: filter.limit,
      }),
      this.prisma.product.count({ where }),
    ]);

    return { items: records.map((record) => ProductMapper.toDomain(record)), total };
  }

  async listSimilar(filter: SimilarProductsFilter): Promise<ProductEntity[]> {
    const records = await this.prisma.product.findMany({
      where: buildWhere(filter),
      select: PRODUCT_DETAIL_SELECT,
      orderBy: { createdAt: 'desc' },
      take: filter.limit,
    });
    return records.map((record) => ProductMapper.toDomain(record));
  }

  async findVariantById(variantId: string): Promise<ProductVariantEntity | null> {
    const record = await this.prisma.productVariant.findUnique({
      where: { id: variantId },
      select: PRODUCT_VARIANT_SELECT,
    });
    return record ? ProductMapper.variantToDomain(record) : null;
  }
}
