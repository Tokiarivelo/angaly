import { useQuery } from '@tanstack/react-query';
import { PatternStatus } from '@angaly/types';
import { fetchPatternProjectDetail } from '../api/pattern-versions.api';

export const PATTERN_PROJECT_KEY = (id: string) => ['pattern-project-detail', id];

export const usePatternVersion = (projectId: string) => {
  return useQuery({
    queryKey: PATTERN_PROJECT_KEY(projectId),
    queryFn: () => fetchPatternProjectDetail(projectId),
    enabled: Boolean(projectId),
    staleTime: 1000 * 30, // 30s
    refetchInterval: (query) => {
      // Auto-poll if GENERATING or REVIEW_REQUIRED
      const status = query.state.data?.status;
      if (status === PatternStatus.GENERATING || status === PatternStatus.REVIEW_REQUIRED) {
        return 10000;
      }
      return false;
    },
  });
};
