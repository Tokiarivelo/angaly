import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchVersionHistory, restoreVersion } from '../api/pattern-versions.api';
import { PATTERN_PROJECT_KEY } from './usePatternVersion';

export const PATTERN_VERSIONS_KEY = (projectId: string) => ['pattern-versions', projectId];

export const useVersionHistory = (projectId: string) => {
  const queryClient = useQueryClient();

  const versionsQuery = useQuery({
    queryKey: PATTERN_VERSIONS_KEY(projectId),
    queryFn: () => fetchVersionHistory(projectId),
    enabled: Boolean(projectId),
    staleTime: 1000 * 60,
  });

  const restoreMutation = useMutation({
    mutationFn: (versionId: string) => restoreVersion(versionId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: PATTERN_PROJECT_KEY(projectId) });
      void queryClient.invalidateQueries({ queryKey: PATTERN_VERSIONS_KEY(projectId) });
    },
  });

  return {
    ...versionsQuery,
    restoreVersion: restoreMutation.mutate,
    isRestoring: restoreMutation.isPending,
  };
};
