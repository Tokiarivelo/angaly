import { apiClient } from '@/lib/api-client';
import type { PatternProjectDto } from '@angaly/types';

export const fetchMyPatternProjects = async (): Promise<PatternProjectDto[]> => {
  try {
    const res = await apiClient.get<PatternProjectDto[] | { data: PatternProjectDto[] }>(
      '/api/pattern-projects?mine=true',
    );
    return Array.isArray(res) ? res : res?.data ?? [];
  } catch {
    return [];
  }
};

export const createPatternProject = async (
  garmentType: string = 'ROBE',
): Promise<PatternProjectDto> => {
  const res = await apiClient.post<PatternProjectDto | { data: PatternProjectDto }>(
    '/api/pattern-projects',
    { garmentType },
  );
  return 'data' in res ? res.data : res;
};
