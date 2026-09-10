import type { Price } from '../value-objects/price.vo';

export interface ProductVariantProps {
  id: string;
  productId: string;
  sku: string;
  size: string;
  color: string;
  material: string | null;
  priceOverride: Price | null;
  quantityAvailable: number;
  quantityReserved: number;
}

/** Invariants: size/color non-empty. */
export class ProductVariantEntity {
  private constructor(private readonly props: ProductVariantProps) {}

  static create(props: ProductVariantProps): ProductVariantEntity {
    if (!props.size.trim()) {
      throw new Error('ProductVariant.size must not be empty');
    }
    if (!props.color.trim()) {
      throw new Error('ProductVariant.color must not be empty');
    }
    return new ProductVariantEntity(props);
  }

  get id(): string {
    return this.props.id;
  }

  get productId(): string {
    return this.props.productId;
  }

  get sku(): string {
    return this.props.sku;
  }

  get size(): string {
    return this.props.size;
  }

  get color(): string {
    return this.props.color;
  }

  get material(): string | null {
    return this.props.material;
  }

  get priceOverride(): Price | null {
    return this.props.priceOverride;
  }

  get quantityAvailable(): number {
    return this.props.quantityAvailable;
  }

  get quantityReserved(): number {
    return this.props.quantityReserved;
  }

  /**
   * Real, sellable stock — reserved units aren't available even though not
   * yet decremented (see docs/features/products.md "Points d'attention":
   * `status` and inventory are distinct, not auto-derived from each other).
   */
  get availableToSell(): number {
    return Math.max(0, this.props.quantityAvailable - this.props.quantityReserved);
  }
}
