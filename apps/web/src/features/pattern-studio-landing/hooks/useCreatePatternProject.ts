import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { createPatternProject, type CreatePatternProjectPayload } from '../api/pattern-projects.api';
import { IN_PROGRESS_PROJECT_QUERY_KEY } from './useInProgressProject';

export const useCreatePatternProject = () => {
  const router = useRouter();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload?: CreatePatternProjectPayload) => createPatternProject(payload),
    onSuccess: (project) => {
      queryClient.invalidateQueries({ queryKey: IN_PROGRESS_PROJECT_QUERY_KEY });
      router.push(`/pattern-studio/wizard/${project.id}`);
    },
  });
};
