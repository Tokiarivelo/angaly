import { useMutation, useQueryClient } from '@tanstack/react-query';
import { generatePattern } from '@/features/pattern-studio-wizard/api/pattern-projects.api';
import { PATTERN_PROJECT_KEY } from './usePatternVersion';
import { PATTERN_VERSIONS_KEY } from './useVersionHistory';

/** Re-runs the deterministic pattern engine with edited body measurements (creates a new version). */
export const useRegeneratePattern = (projectId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (measurements: Record<string, number>) => generatePattern(projectId, { measurements }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: PATTERN_PROJECT_KEY(projectId) });
      void queryClient.invalidateQueries({ queryKey: PATTERN_VERSIONS_KEY(projectId) });
    },
  });
};
