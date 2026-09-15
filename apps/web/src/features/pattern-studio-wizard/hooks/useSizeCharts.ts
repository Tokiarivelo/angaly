'use client';

import { useQuery } from '@tanstack/react-query';
import { fetchSizeChart } from '../api/size-charts.api';
import type { SizeChartGender } from '@angaly/types';

export const useSizeCharts = (gender: SizeChartGender) => {
  return useQuery({
    queryKey: ['pattern-studio-size-chart', gender],
    queryFn: () => fetchSizeChart(gender),
    staleTime: 1000 * 60 * 60, // static reference data
  });
};
