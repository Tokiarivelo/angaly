import type {
  CreationProjectAssigneeDto,
  CreationProjectDetailDto,
  CreationProjectDto,
  CreationProjectStage,
} from '@angaly/types';
import { apiClient } from '@/lib/api-client';

export const adminCreationProjectsApi = {
  list: async (stage?: CreationProjectStage): Promise<CreationProjectDto[]> => {
    const url = stage ? `/admin/creation-projects?stage=${stage}` : '/admin/creation-projects';
    return apiClient.get<CreationProjectDto[]>(url);
  },

  updateStage: async (id: string, stage: CreationProjectStage): Promise<CreationProjectDto> => {
    return apiClient.patch<CreationProjectDto>(`/admin/creation-projects/${id}/stage`, { stage });
  },

  get: async (id: string): Promise<CreationProjectDetailDto> => {
    return apiClient.get<CreationProjectDetailDto>(`/admin/creation-projects/${id}`);
  },

  listAssignees: async (): Promise<CreationProjectAssigneeDto[]> => {
    return apiClient.get<CreationProjectAssigneeDto[]>('/admin/creation-projects/assignees');
  },

  assign: async (id: string, userId: string | null): Promise<CreationProjectDto> => {
    return apiClient.patch<CreationProjectDto>(`/admin/creation-projects/${id}/assignee`, { userId });
  },
};
