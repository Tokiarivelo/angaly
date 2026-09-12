import { apiClient } from '@/lib/api-client';
import type { MeasurementUnit } from '@angaly/types';

export interface MeasurementProfileDto {
  id: string;
  customerId: string;
  label: string;
  unit: MeasurementUnit;
  values: Record<string, number>;
  createdAt: string;
  updatedAt: string;
}

export interface CreateMeasurementProfileDto {
  label: string;
  unit: MeasurementUnit;
  values: Record<string, number>;
}

export interface UpdateMeasurementProfileDto {
  label?: string;
  unit?: MeasurementUnit;
  values?: Record<string, number>;
}

export const fetchMeasurementProfiles = async (): Promise<MeasurementProfileDto[]> => {
  return await apiClient.get<MeasurementProfileDto[]>('/api/measurement-profiles');
};

export const createMeasurementProfile = async (
  payload: CreateMeasurementProfileDto,
): Promise<MeasurementProfileDto> => {
  return await apiClient.post<MeasurementProfileDto>('/api/measurement-profiles', payload);
};

export const updateMeasurementProfile = async (
  id: string,
  payload: UpdateMeasurementProfileDto,
): Promise<MeasurementProfileDto> => {
  return await apiClient.patch<MeasurementProfileDto>(
    `/api/measurement-profiles/${id}`,
    payload,
  );
};

export const duplicateMeasurementProfile = async (
  id: string,
): Promise<MeasurementProfileDto> => {
  return await apiClient.post<MeasurementProfileDto>(
    `/api/measurement-profiles/${id}/duplicate`,
  );
};

export const deleteMeasurementProfile = async (id: string): Promise<void> => {
  await apiClient.delete(`/api/measurement-profiles/${id}`);
};
