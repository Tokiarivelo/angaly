import { apiClient } from '@/lib/api-client';
import type { PatternProjectDto } from '@angaly/types';

export interface CreatePatternProjectPayload {
  garmentType?: string;
  occasion?: string;
  style?: string;
  cutType?: string;
  detailsJson?: Record<string, string>;
  measurementProfileId?: string;
}

export const fetchInProgressProject = async (): Promise<PatternProjectDto | null> => {
  try {
    const res = await apiClient.get<PatternProjectDto[] | { data: PatternProjectDto[] }>(
      '/api/pattern-projects?mine=true&status=DRAFT,GENERATING,GENERATED,REVIEW_REQUIRED,CORRECTION_REQUIRED&limit=1',
    );
    const list = Array.isArray(res) ? res : res?.data ?? [];
    return list[0] ?? null;
  } catch {
    // Silently return null if not authenticated or not found
    return null;
  }
};

export const createPatternProject = async (
  payload?: CreatePatternProjectPayload,
): Promise<PatternProjectDto> => {
  return await apiClient.post<PatternProjectDto>('/api/pattern-projects', {
    garmentType: payload?.garmentType ?? 'ROBE',
    ...payload,
  });
};
