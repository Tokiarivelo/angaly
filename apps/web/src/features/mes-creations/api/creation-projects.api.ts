import { apiClient } from '@/lib/api-client';
import type { CreationProjectDto } from '@angaly/types';

export const fetchMyCreationProjects = async (): Promise<CreationProjectDto[]> => {
  const res = await apiClient.get<CreationProjectDto[] | { data: CreationProjectDto[] }>(
    '/api/creation-projects',
  );
  return Array.isArray(res) ? res : res?.data ?? [];
};
