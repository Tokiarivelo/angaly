import type { Price } from '../value-objects/price.vo';
import type { ProductAvailability } from '../value-objects/product-availability.vo';
import { isProductAvailability } from '../value-objects/product-availability.vo';
import type { ProductVariantEntity } from './product-variant.entity';

export interface ProductMediaSummary {
  id: string;
  url: string;
  altText: string;
  sortOrder: number;
}

export interface ProductCategorySummary {
  id: string;
  slug: string;
  name: string;
}

export interface ProductProps {
  id: string;
  sku: string;
  slug: string;
  name: string;
  description: string;
  price: Price;
  status: string;
  category: ProductCategorySummary;
  media: ProductMediaSummary[];
  variants: ProductVariantEntity[];
  createdAt: Date;
  updatedAt: Date;
}

interface NormalizedProductProps extends Omit<ProductProps, 'status'> {
  status: ProductAvailability;
}

/** Invariants: sku/slug non-empty, status is a recognized ProductAvailability. */
export class ProductEntity {
  private constructor(private readonly props: NormalizedProductProps) {}

  static create(props: ProductProps): ProductEntity {
    if (!props.sku.trim()) {
      throw new Error('Product.sku must not be empty');
    }
    if (!props.slug.trim()) {
      throw new Error('Product.slug must not be empty');
    }
    if (!isProductAvailability(props.status)) {
      throw new Error(`Product.status must be a recognized ProductAvailability, got "${props.status}"`);
    }
    return new ProductEntity({ ...props, status: props.status });
  }

  get id(): string {
    return this.props.id;
  }

  get sku(): string {
    return this.props.sku;
  }

  get slug(): string {
    return this.props.slug;
  }

  get name(): string {
    return this.props.name;
  }

  get description(): string {
    return this.props.description;
  }

  get price(): Price {
    return this.props.price;
  }

  get status(): ProductAvailability {
    return this.props.status;
  }

  get category(): ProductCategorySummary {
    return this.props.category;
  }

  get media(): ProductMediaSummary[] {
    return this.props.media;
  }

  get variants(): ProductVariantEntity[] {
    return this.props.variants;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }
}
