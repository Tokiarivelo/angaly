import type { CreationProjectDto, CreationProjectStage } from '@angaly/types';
import { apiClient } from '@/lib/api-client';

export const adminCreationProjectsApi = {
  list: async (stage?: CreationProjectStage): Promise<CreationProjectDto[]> => {
    const url = stage ? `/admin/creation-projects?stage=${stage}` : '/admin/creation-projects';
    return apiClient.get<CreationProjectDto[]>(url);
  },

  updateStage: async (id: string, stage: CreationProjectStage): Promise<CreationProjectDto> => {
    return apiClient.patch<CreationProjectDto>(`/admin/creation-projects/${id}/stage`, { stage });
  },
};
