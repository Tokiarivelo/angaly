import { useMutation, useQueryClient } from '@tanstack/react-query';
import { exportPatternVersion } from '../api/pattern-versions.api';
import type { PatternExportFormat } from '@angaly/types';
import { PATTERN_PROJECT_KEY } from './usePatternVersion';

export const useExportPattern = (projectId: string, versionId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (format: PatternExportFormat) =>
      exportPatternVersion(versionId, format),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: PATTERN_PROJECT_KEY(projectId) });
      if (data.mediaUrl) {
        window.open(data.mediaUrl, '_blank');
      }
    },
  });
};
