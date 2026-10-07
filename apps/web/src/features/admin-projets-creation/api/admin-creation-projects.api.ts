import type {
  AdminCustomerOptionDto,
  AdminQuoteOptionDto,
  CreateAdminCreationProjectInput,
  CreationProjectAssigneeDto,
  CreationProjectDetailDto,
  CreationProjectDto,
  CreationProjectStage,
  CreationProjectStageMediaDto,
  CreationProjectStageNoteDto,
  GenerateCreationProjectAiPatternInput,
  GenerateCreationProjectAiPatternResponseDto,
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

  create: async (input: CreateAdminCreationProjectInput): Promise<CreationProjectDto> => {
    return apiClient.post<CreationProjectDto>('/admin/creation-projects', input);
  },

  listCustomers: async (q?: string): Promise<AdminCustomerOptionDto[]> => {
    const url = q ? `/admin/creation-projects/customers?q=${encodeURIComponent(q)}` : '/admin/creation-projects/customers';
    return apiClient.get<AdminCustomerOptionDto[]>(url);
  },

  listQuotes: async (): Promise<AdminQuoteOptionDto[]> => {
    return apiClient.get<AdminQuoteOptionDto[]>('/admin/creation-projects/quotes');
  },

  addNote: async (
    id: string,
    input: { stage: CreationProjectStage; content: string },
  ): Promise<CreationProjectStageNoteDto> => {
    return apiClient.post<CreationProjectStageNoteDto>(`/admin/creation-projects/${id}/notes`, input);
  },

  deleteNote: async (id: string, noteId: string): Promise<void> => {
    return apiClient.delete<void>(`/admin/creation-projects/${id}/notes/${noteId}`);
  },

  addMedia: async (
    id: string,
    input: {
      stage: CreationProjectStage;
      url: string;
      title?: string | undefined;
      fileName?: string | undefined;
      mimeType?: string | undefined;
      sizeBytes?: number | undefined;
    },
  ): Promise<CreationProjectStageMediaDto> => {
    return apiClient.post<CreationProjectStageMediaDto>(`/admin/creation-projects/${id}/media`, input);
  },

  deleteMedia: async (id: string, mediaId: string): Promise<void> => {
    return apiClient.delete<void>(`/admin/creation-projects/${id}/media/${mediaId}`);
  },

  generateAiPattern: async (
    id: string,
    input: GenerateCreationProjectAiPatternInput,
  ): Promise<GenerateCreationProjectAiPatternResponseDto> => {
    return apiClient.post<GenerateCreationProjectAiPatternResponseDto>(
      `/admin/creation-projects/${id}/generate-pattern`,
      input,
    );
  },
};
