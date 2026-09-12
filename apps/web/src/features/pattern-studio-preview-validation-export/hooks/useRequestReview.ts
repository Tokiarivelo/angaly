import { useMutation, useQueryClient } from '@tanstack/react-query';
import { requestReview } from '../api/pattern-versions.api';
import { PATTERN_PROJECT_KEY } from './usePatternVersion';

export const useRequestReview = (projectId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => requestReview(projectId),
    onSuccess: (updated) => {
      queryClient.setQueryData(PATTERN_PROJECT_KEY(projectId), updated);
      queryClient.invalidateQueries({ queryKey: PATTERN_PROJECT_KEY(projectId) });
    },
  });
};
