import { apiClient } from '@/lib/api-client';
import type {
  PatternProjectDto,
  PatternVersionDto,
  PatternExportDto,
  PatternExportFormat,
} from '@angaly/types';

export const fetchPatternProjectDetail = async (
  id: string,
): Promise<PatternProjectDto> => {
  const res = await apiClient.get<PatternProjectDto | { data: PatternProjectDto }>(
    `/api/pattern-projects/${id}`,
  );
  return 'data' in res ? res.data : res;
};

export const requestReview = async (
  projectId: string,
): Promise<PatternProjectDto> => {
  const res = await apiClient.post<PatternProjectDto | { data: PatternProjectDto }>(
    `/api/pattern-projects/${projectId}/request-review`,
  );
  return 'data' in res ? res.data : res;
};

export const exportPatternVersion = async (
  versionId: string,
  format: PatternExportFormat,
): Promise<PatternExportDto> => {
  const res = await apiClient.post<PatternExportDto | { data: PatternExportDto }>(
    `/api/pattern-versions/${versionId}/export`,
    { format },
  );
  return 'data' in res ? res.data : res;
};

export const fetchVersionHistory = async (
  projectId: string,
): Promise<PatternVersionDto[]> => {
  try {
    const res = await apiClient.get<PatternVersionDto[] | { data: PatternVersionDto[] }>(
      `/api/pattern-projects/${projectId}/versions`,
    );
    return Array.isArray(res) ? res : res?.data ?? [];
  } catch {
    return [];
  }
};

export const restoreVersion = async (
  versionId: string,
): Promise<PatternVersionDto> => {
  const res = await apiClient.post<PatternVersionDto | { data: PatternVersionDto }>(
    `/api/pattern-versions/${versionId}/restore`,
  );
  return 'data' in res ? res.data : res;
};
