import { apiClient } from '@/lib/api-client';
import type { MeasurementUnit } from '@angaly/types';

export interface MeasurementProfileSummary {
  id: string;
  label: string;
  unit: MeasurementUnit;
  values: Record<string, number>;
  createdAt: string;
}

export const fetchMeasurementProfiles = async (): Promise<MeasurementProfileSummary[]> => {
  try {
    const res = await apiClient.get<MeasurementProfileSummary[] | { data: MeasurementProfileSummary[] }>(
      '/api/measurement-profiles',
    );
    return Array.isArray(res) ? res : res.data ?? [];
  } catch {
    return [];
  }
};
