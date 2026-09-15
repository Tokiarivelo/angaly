import { apiClient } from '@/lib/api-client';
import type { SizeChartEntry, SizeChartGender } from '@angaly/types';

export const fetchSizeChart = async (gender: SizeChartGender): Promise<SizeChartEntry[]> => {
  try {
    const res = await apiClient.get<SizeChartEntry[] | { data: SizeChartEntry[] }>(
      `/api/measurements/size-charts?gender=${gender}`,
    );
    return Array.isArray(res) ? res : res.data ?? [];
  } catch {
    return [];
  }
};
