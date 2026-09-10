/** Domain-local mirror of `FavoriteEntityType` (`@angaly/types` / `schema.prisma`) — the Domain layer must not import `@angaly/types`. */
export const FAVORITE_ENTITY_TYPES = ['CREATION', 'PRODUCT', 'COLLECTION'] as const;

export type FavoriteEntityType = (typeof FAVORITE_ENTITY_TYPES)[number];

export interface FavoriteProps {
  id: string;
  customerId: string;
  entityType: FavoriteEntityType;
  entityId: string;
  createdAt: Date;
}

/** Invariants: entityType is a known type, entityId non-empty. */
export class FavoriteEntity {
  private constructor(private readonly props: FavoriteProps) {}

  static create(props: FavoriteProps): FavoriteEntity {
    if (!FAVORITE_ENTITY_TYPES.includes(props.entityType)) {
      throw new Error(`Favorite.entityType must be one of ${FAVORITE_ENTITY_TYPES.join(', ')}`);
    }
    if (!props.entityId.trim()) {
      throw new Error('Favorite.entityId must not be empty');
    }
    return new FavoriteEntity(props);
  }

  get id(): string {
    return this.props.id;
  }

  get customerId(): string {
    return this.props.customerId;
  }

  get entityType(): FavoriteEntityType {
    return this.props.entityType;
  }

  get entityId(): string {
    return this.props.entityId;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }
}
