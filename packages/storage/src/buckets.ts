/**
 * Bucket layout — one bucket per media folder from
 * docs/specifications/ANGALY_Specifications_Completes.md §76.
 * Keep in sync with MediaEntityType in @angaly/types.
 */
export const STORAGE_BUCKETS = {
  creations: 'creations',
  products: 'products',
  collections: 'collections',
  ateliers: 'ateliers',
  customers: 'customers',
  patterns: 'patterns',
  blog: 'blog',
  avatars: 'avatars',
} as const;

export type StorageBucketName = (typeof STORAGE_BUCKETS)[keyof typeof STORAGE_BUCKETS];

export const ALL_STORAGE_BUCKETS: StorageBucketName[] = Object.values(STORAGE_BUCKETS);
