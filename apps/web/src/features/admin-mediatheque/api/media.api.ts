import { apiClient } from '@/lib/api-client';
import type { MediaEntityType, PaginatedResponse } from '@angaly/types';

import type { MediaDetailDto, MediaItemDto } from '../types/media-item.types';

export interface ListMediaParams {
  entityType?: MediaEntityType;
  search?: string;
  sortBy?: 'recent' | 'name' | 'size';
  page: number;
  limit: number;
}

export const fetchMediaList = (params: ListMediaParams): Promise<PaginatedResponse<MediaItemDto>> => {
  const query = new URLSearchParams();
  if (params.entityType) query.set('entityType', params.entityType);
  if (params.search) query.set('search', params.search);
  if (params.sortBy) query.set('sortBy', params.sortBy);
  query.set('page', String(params.page));
  query.set('limit', String(params.limit));

  return apiClient.get<PaginatedResponse<MediaItemDto>>(`/api/media?${query.toString()}`);
};

export const fetchMediaDetail = (id: string): Promise<MediaDetailDto> =>
  apiClient.get<MediaDetailDto>(`/api/media/${id}`);

export interface PresignedUploadResponse {
  bucket: string;
  objectKey: string;
  uploadUrl: string;
  expiresInSeconds: number;
}

export const createPresignedUpload = (
  entityType: MediaEntityType,
  originalFilename: string,
  mimeType: string,
): Promise<PresignedUploadResponse> =>
  apiClient.post<PresignedUploadResponse>('/api/media/presigned-upload', {
    entityType,
    originalFilename,
    mimeType,
  });

export interface ConfirmUploadInput {
  bucket: string;
  objectKey: string;
  entityType: MediaEntityType;
  altText: string;
  mimeType: string;
  sizeBytes: number;
  width?: number;
  height?: number;
}

export const confirmUpload = (input: ConfirmUploadInput): Promise<MediaItemDto> =>
  apiClient.post<MediaItemDto>('/api/media/confirm', input);

export interface UpdateMediaInput {
  altText?: string;
  bucket?: string;
  objectKey?: string;
  mimeType?: string;
  sizeBytes?: number;
  width?: number;
  height?: number;
}

export const updateMedia = (id: string, input: UpdateMediaInput): Promise<MediaItemDto> =>
  apiClient.patch<MediaItemDto>(`/api/media/${id}`, input);

export const deleteMedia = (id: string): Promise<void> => apiClient.delete<void>(`/api/media/${id}`);
