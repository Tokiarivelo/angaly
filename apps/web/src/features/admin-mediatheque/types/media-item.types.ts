import type { MediaEntityType } from '@angaly/types';

/**
 * Mirrors `apps/api/src/media` DTOs exactly (`MediaResponseDto`/`MediaDetailResponseDto`) —
 * richer than the shared `@angaly/types` `MediaDto` (which omits `sizeBytes`/`createdAt`,
 * both needed here for the grid's size badge and the sort control). Kept local rather than
 * widening the shared type, same pattern as `admin-ai-settings/api/ai-model-settings.api.ts`
 * — a shared entry can be added once a second admin consumer needs the exact same shape.
 */
export interface MediaItemDto {
  id: string;
  url: string;
  altText: string | null;
  mimeType: string;
  sizeBytes: number;
  width: number | null;
  height: number | null;
  entityType: MediaEntityType;
  entityId: string | null;
  sortOrder: number;
  createdAt: string;
}

export interface MediaUsageDto {
  entityType: string;
  entityId: string;
  label: string;
}

export interface MediaDetailDto extends MediaItemDto {
  usedIn: MediaUsageDto[];
}
