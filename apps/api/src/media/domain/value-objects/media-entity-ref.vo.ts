/**
 * Domain-local mirror of `MediaEntityType` (`@angaly/types` / `schema.prisma`).
 * Duplicated on purpose: the Domain layer must not import `@angaly/types`
 * (see .cursor/rules/003-nestjs-clean-arch.mdc) — keep both enums in sync by hand.
 */
export const MEDIA_ENTITY_TYPES = [
  'CREATION',
  'PRODUCT',
  'COLLECTION',
  'ATELIER',
  'CUSTOMER_AVATAR',
  'PATTERN_EXPORT',
  'BLOG_POST',
  'PAGE_SECTION',
] as const;

export type MediaEntityType = (typeof MEDIA_ENTITY_TYPES)[number];

/**
 * Maps each entity type to the MinIO bucket it is stored in
 * (packages/storage/src/buckets.ts). The backend always derives the bucket
 * from the entity type — the client never chooses it (docs/features/media.md).
 *
 * PAGE_SECTION falls back to the `customers` bucket: it is the only bucket
 * without a 1:1 name match once the other seven entity types are assigned,
 * and PAGE_SECTION media (admin CMS content, Phase 6) has no dedicated
 * bucket of its own in the spec. Revisit if Phase 6 introduces one.
 */
const ENTITY_TYPE_TO_BUCKET: Record<MediaEntityType, string> = {
  CREATION: 'creations',
  PRODUCT: 'products',
  COLLECTION: 'collections',
  ATELIER: 'ateliers',
  CUSTOMER_AVATAR: 'avatars',
  PATTERN_EXPORT: 'patterns',
  BLOG_POST: 'blog',
  PAGE_SECTION: 'customers',
};

export function isMediaEntityType(value: string): value is MediaEntityType {
  return (MEDIA_ENTITY_TYPES as readonly string[]).includes(value);
}

export function resolveBucketForEntityType(entityType: MediaEntityType): string {
  return ENTITY_TYPE_TO_BUCKET[entityType];
}

/** Couple (entityType, entityId) validated against MediaEntityType. */
export class MediaEntityRef {
  private constructor(
    public readonly entityType: MediaEntityType,
    public readonly entityId: string | null,
  ) {}

  static create(entityType: string, entityId: string | null): MediaEntityRef {
    if (!isMediaEntityType(entityType)) {
      throw new Error(`Invalid MediaEntityType: ${entityType}`);
    }
    if (entityId !== null && entityId.trim().length === 0) {
      throw new Error('MediaEntityRef.entityId must not be an empty string');
    }
    return new MediaEntityRef(entityType, entityId);
  }
}
