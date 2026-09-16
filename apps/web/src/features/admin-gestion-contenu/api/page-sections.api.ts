import { apiClient } from '@/lib/api-client';
import type { ContentStatus, Locale } from '@angaly/types';

/**
 * Local response shapes mirroring `apps/api/src/content` DTOs — same pattern
 * as `admin-ai-settings/api/ai-model-settings.api.ts` (a dedicated shared
 * `@angaly/types` entry can be added once a second consumer needs it).
 */
export interface SectionSummaryDto {
  sectionKey: string;
  status: ContentStatus;
  updatedAt: string;
  locales: Locale[];
}

export interface PageSectionGroupDto {
  page: string;
  sections: SectionSummaryDto[];
}

export interface PageSectionDto {
  id: string;
  page: string;
  sectionKey: string;
  locale: Locale;
  titleText: string | null;
  subtitleText: string | null;
  bodyText: string | null;
  ctaPrimaryLabel: string | null;
  ctaSecondaryLabel: string | null;
  dataJson: unknown;
  mediaId: string | null;
  status: ContentStatus;
  updatedById: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PageSectionVersionDto {
  id: string;
  pageSectionId: string;
  snapshotJson: Record<string, unknown>;
  editedById: string | null;
  createdAt: string;
}

export interface SaveSectionDraftInput {
  locale: Locale;
  titleText?: string | null | undefined;
  subtitleText?: string | null | undefined;
  bodyText?: string | null | undefined;
  ctaPrimaryLabel?: string | null | undefined;
  ctaSecondaryLabel?: string | null | undefined;
  mediaId?: string | null | undefined;
}

export const fetchSectionGroups = (): Promise<PageSectionGroupDto[]> =>
  apiClient.get<PageSectionGroupDto[]>('/api/content/sections');

export const fetchSection = (page: string, sectionKey: string): Promise<PageSectionDto[]> =>
  apiClient.get<PageSectionDto[]>(`/api/content/sections/${page}/${sectionKey}`);

export const saveSectionDraft = (
  page: string,
  sectionKey: string,
  input: SaveSectionDraftInput,
): Promise<PageSectionDto> =>
  apiClient.patch<PageSectionDto>(`/api/content/sections/${page}/${sectionKey}`, input);

export const publishSection = (page: string, sectionKey: string, locale: Locale): Promise<PageSectionDto> =>
  apiClient.post<PageSectionDto>(`/api/content/sections/${page}/${sectionKey}/publish`, { locale });

export const fetchSectionVersions = (pageSectionId: string): Promise<PageSectionVersionDto[]> =>
  apiClient.get<PageSectionVersionDto[]>(`/api/content/sections/${pageSectionId}/versions`);

export const restoreSectionVersion = (pageSectionId: string, versionId: string): Promise<PageSectionDto> =>
  apiClient.post<PageSectionDto>(`/api/content/sections/${pageSectionId}/versions/${versionId}/restore`, {});
